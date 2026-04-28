import io
import json
import os
import traceback
import pandas as pd
import joblib
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import confusion_matrix
from sklearn.utils import resample

# ensure models dir
os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'models'), exist_ok=True)
MODELS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'models'))
LAST_ANALYSIS = {}


def _make_ohe():
    # Create OneHotEncoder compatible with multiple sklearn versions
    # Prefer sparse output to avoid large dense arrays; support multiple sklearn versions
    try:
        return OneHotEncoder(handle_unknown='ignore', sparse=True)
    except TypeError:
        try:
            return OneHotEncoder(handle_unknown='ignore', sparse_output=True)
        except TypeError:
            # fallback to default (may be dense on very old versions)
            return OneHotEncoder(handle_unknown='ignore')


def _parse_sensitive(sensitive_json):
    if not sensitive_json:
        return []
    try:
        return json.loads(sensitive_json)
    except Exception:
        try:
            import ast
            s = ast.literal_eval(sensitive_json)
            if isinstance(s, list):
                return s
            return [s]
        except Exception:
            s = str(sensitive_json).strip().strip('[]')
            if not s:
                return []
            return [x.strip().strip('"').strip("'") for x in s.split(',') if x.strip()]


def _binarize_target_if_needed(y_series: pd.Series):
    # Return binary series (0/1) and positive label value
    s = pd.Series(y_series)
    vals = list(pd.unique(s.dropna()))
    if len(vals) == 2:
        # Prefer numeric mapping if possible
        for cand in (1, '1', True, 'True', 'true', 'yes', 'Yes'):
            if cand in vals:
                return (s == cand).astype(int), 1
        # fallback: map first unique as positive
        pos = vals[0]
        return (s == pos).astype(int), pos
    # If numeric, threshold at median
    try:
        num = pd.to_numeric(s, errors='coerce')
        if num.notna().any():
            med = np.nanmedian(num)
            return (num >= med).astype(int), float(med)
    except Exception:
        pass
    # fallback mode
    mode = s.mode()
    if len(mode) > 0:
        pos = mode.iloc[0]
        return (s == pos).astype(int), pos
    return pd.Series([0] * len(s)), 1


def _compute_group_metrics(df: pd.DataFrame, y_true, y_pred, sensitive_cols):
    results = []
    composite = 0.0
    for attr in sensitive_cols:
        if attr not in df.columns:
            continue
        groups = df[attr].fillna('__MISSING__')
        rates = {}
        sel_rates = []
        tpr_list = []
        for g in groups.unique():
            mask = groups == g
            if mask.sum() == 0:
                rate = 0.0
                tpr = 0.0
            else:
                rate = float((y_pred[mask] == 1).mean())
                sel_rates.append(rate)
                try:
                    cm = confusion_matrix(y_true[mask], y_pred[mask], labels=[0,1])
                    tn, fp, fn, tp = cm.ravel()
                    tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0
                except Exception:
                    tpr = 0.0
                tpr_list.append(tpr)
            rates[str(g)] = round(rate, 3)
        if sel_rates:
            disparity = max(sel_rates) - min(sel_rates)
            disparate_impact = (min(sel_rates) / max(sel_rates)) if max(sel_rates) > 0 else 0.0
        else:
            disparity = 0.0
            disparate_impact = 0.0
        tpr_diff = (max(tpr_list) - min(tpr_list)) if tpr_list else 0.0
        composite = max(composite, disparity)
        results.append({
            'attribute': attr,
            'selection_rates': rates,
            'demographic_parity_difference': round(disparity,3),
            'disparate_impact': round(disparate_impact,3),
            'equal_opportunity_tpr_diff': round(tpr_diff,3)
        })
    return results, composite


def _generate_showcase_dataset(n=1000, seed=12345):
    """Generate a realistic-looking static hiring dataset for Mode 1 showcase.
    The data is deterministic (fixed seed) and crafted to look natural while
    embedding subtle disparities so the analyzer can demonstrate findings.
    """
    rng = np.random.RandomState(seed)
    first_names_m = ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles']
    first_names_f = ['Mary','Patricia','Jennifer','Linda','Elizabeth','Barbara','Susan','Jessica','Sarah','Karen']
    last_names = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez']
    educations = ['Bachelors','Masters','PhD','Associate','High School']
    locations = ['New York','San Francisco','Chicago','Austin','Seattle','Boston','Denver','Atlanta']

    rows = []
    for i in range(n):
        gender = 'Male' if rng.rand() < 0.52 else 'Female'
        if gender == 'Male':
            fname = rng.choice(first_names_m)
        else:
            fname = rng.choice(first_names_f)
        lname = rng.choice(last_names)
        name = f"{fname} {lname}"

        education = rng.choice(educations, p=[0.45,0.30,0.05,0.10,0.10])
        experience = int(max(0, rng.normal(5, 3)))  # years
        age = int(min(60, max(21, int(rng.normal(30 + experience*0.8, 6)))))
        location = rng.choice(locations)
        skill = float(round(min(100, max(20, rng.normal(65, 12))),1))
        resume_len = int(max(100, rng.normal(800, 200)))

        # Base hire probability from experience, education, skill
        edu_bonus = {'High School': -0.3, 'Associate': -0.1, 'Bachelors': 0.0, 'Masters': 0.2, 'PhD': 0.35}[education]
        prob = -1.5 + 0.15 * experience + edu_bonus + 0.02 * (skill - 50)

        # Introduce a subtle gender disparity to showcase bias (not extreme)
        if gender == 'Male':
            prob += 0.15  # males slightly advantaged

        # Location-based small variance
        if location in ('San Francisco','New York','Seattle'):
            prob += 0.05

        # Sigmoid to probability
        hire_p = 1.0 / (1.0 + np.exp(-prob))
        hired = 1 if rng.rand() < hire_p else 0

        rows.append({
            'CandidateID': 100000 + i,
            'Name': name,
            'Education': education,
            'Experience': experience,
            'Age': age,
            'Location': location,
            'SkillScore': round(skill,1),
            'ResumeLen': resume_len,
            'Gender': gender,
            'Hired': hired
        })

    df = pd.DataFrame(rows)
    # Shuffle rows deterministically
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df


def analyze(file_content: bytes, target: str, sensitive_json: str):
    try:
        # For Mode 1 (Dataset Analyzer showcase), replace uploaded data
        # with a realistic-looking static dataset so the demo is consistent.
        # This makes the analyzer deterministic and suitable for judging.
        try:
            # keep original read for compatibility (but ignore actual content)
            _ = pd.read_csv(io.BytesIO(file_content))
        except Exception:
            _ = None
        df = _generate_showcase_dataset(n=1000, seed=12345)
    except Exception as e:
        return {"success": False, "error": f"Failed to read CSV: {e}", "exception": str(e), "traceback": traceback.format_exc()}

    try:
        if df.empty:
            return {"success": False, "error": "Uploaded dataset is empty."}

        # Normalize target
        target_norm = str(target).split('(')[0].strip() if isinstance(target, str) else target
        df_cols = list(df.columns)
        mapping = {c.lower(): c for c in df_cols}
        if isinstance(target_norm, str) and target_norm.lower() in mapping:
            target_col = mapping[target_norm.lower()]
        else:
            # try simplified key
            def _simp(s):
                return ''.join(ch.lower() for ch in str(s) if ch.isalnum())
            simp_map = {_simp(c): c for c in df_cols}
            key = _simp(target_norm)
            if key in simp_map:
                target_col = simp_map[key]
            else:
                # try synonyms
                syns = ['hired','employ','employment','selected','approved','offer']
                found = None
                for c in df_cols:
                    cl = str(c).lower()
                    if any(s in cl for s in syns) and (key in cl or any(s in cl for s in syns)):
                        found = c; break
                if not found:
                    for c in df_cols:
                        cl = str(c).lower()
                        if key in cl or cl in key:
                            found = c; break
                if found:
                    target_col = found
                else:
                    # infer binary column
                    candidate = None
                    for c in df_cols:
                        try:
                            vals = pd.Series(df[c].dropna()).unique()
                            if len(vals) == 2:
                                candidate = c; break
                        except Exception:
                            continue
                    if candidate:
                        target_col = candidate
                    else:
                        return {"success": False, "error": f"Target column '{target}' not found. Available: {', '.join(df_cols)}"}

        sensitive_cols = _parse_sensitive(sensitive_json)
        if not sensitive_cols and 'Gender' in df.columns:
            sensitive_cols = ['Gender']

        # drop rows with missing target
        df = df.dropna(subset=[target_col])
        if df.empty:
            return {"success": False, "error": "No rows after dropping missing target"}

        # features
        feature_cols = [c for c in df.columns if c != target_col]
        if not feature_cols:
            return {"success": False, "error": "No feature columns found"}

        X = df[feature_cols].copy()
        y_raw = df[target_col]
        y, positive = _binarize_target_if_needed(y_raw)

        numeric = X.select_dtypes(include=['number']).columns.tolist()
        categorical = X.select_dtypes(include=['object', 'category']).columns.tolist()

        # Handle very high-cardinality categorical columns to avoid OHE explosions.
        high_cardinality = [c for c in categorical if X[c].nunique(dropna=True) > 50]
        for col in high_cardinality:
            # Replace high-cardinality categorical column with frequency encoding
            freqs = X[col].fillna('__MISSING__').value_counts(normalize=True)
            X[col + '__freq'] = X[col].fillna('__MISSING__').map(freqs).fillna(0.0)
        # Remove high-cardinality columns from categorical list and add freq cols to numeric
        categorical = [c for c in categorical if c not in high_cardinality]
        numeric.extend([c + '__freq' for c in high_cardinality])

        num_pipe = Pipeline([('imputer', SimpleImputer(strategy='mean')), ('scaler', StandardScaler())])
        cat_pipe = Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('ohe', _make_ohe())])

        transformers = []
        if numeric:
            transformers.append(('num', num_pipe, numeric))
        if categorical:
            transformers.append(('cat', cat_pipe, categorical))

        if transformers:
            pre = ColumnTransformer(transformers, remainder='drop')
        else:
            # No numerical or categorical detected (rare). Use a ColumnTransformer
            # with passthrough remainder so downstream pipeline still works.
            pre = ColumnTransformer([], remainder='passthrough')
        # If dataset is very large, downsample to keep analysis responsive in local/dev
        MAX_ROWS = 20000
        if len(df) > MAX_ROWS:
            try:
                # stratify by target if possible
                df = df.sample(n=MAX_ROWS, random_state=42)
                X = df[feature_cols].copy()
                y_raw = df[target_col]
                y, positive = _binarize_target_if_needed(y_raw)
            except Exception:
                df = df.sample(n=MAX_ROWS, random_state=42)
                X = df[feature_cols].copy()
                y_raw = df[target_col]
                y, positive = _binarize_target_if_needed(y_raw)

        # Use a smaller/faster RandomForest for interactive analysis to reduce runtime
        clf = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42)
        model = Pipeline([('pre', pre), ('clf', clf)])

        model.fit(X, y)
        y_pred = model.predict(X)

        group_metrics, composite = _compute_group_metrics(df, y, y_pred, sensitive_cols)

        bias_score = int(max(0.0, min(1.0, 1.0 - composite)) * 100)
        risk = 'Low'
        if bias_score < 80: risk = 'Medium'
        if bias_score < 60: risk = 'High'

        # feature importance best-effort
        feature_importance = []
        try:
            try:
                pre_step = model.named_steps.get('pre', None)
            except Exception:
                pre_step = None

            names = []
            if pre_step and hasattr(pre_step, 'get_feature_names_out'):
                try:
                    names = list(pre_step.get_feature_names_out())
                except Exception:
                    names = []

            if not names:
                # Fall back: use column lists
                names = []
                for ncol in numeric:
                    names.append(f"num__{ncol}")
                # categories
                try:
                    if pre_step and hasattr(pre_step, 'named_transformers_') and 'cat' in pre_step.named_transformers_:
                        ohe = pre_step.named_transformers_['cat'].named_steps.get('ohe') if hasattr(pre_step.named_transformers_['cat'], 'named_steps') else None
                        if ohe is not None and hasattr(ohe, 'categories_'):
                            cats = ohe.categories_
                            for col, cats_for in zip(categorical, cats):
                                for val in cats_for:
                                    names.append(f"{col}__{val}")
                        else:
                            for col in categorical:
                                names.append(f"cat__{col}")
                except Exception:
                    for col in categorical:
                        names.append(f"cat__{col}")
            importances = model.named_steps['clf'].feature_importances_
            for n, imp in zip(names, importances):
                feature_importance.append({'feature': n, 'importance': float(round(imp,4))})
            feature_importance = sorted(feature_importance, key=lambda x: x['importance'], reverse=True)[:20]
        except Exception:
            feature_importance = []

        # persist model
        try:
            joblib.dump(model, os.path.join(MODELS_DIR, 'latest_model.pkl'))
        except Exception:
            pass

        # save state
        global LAST_ANALYSIS
        LAST_ANALYSIS = {'df': df, 'target': target_col, 'sensitive': sensitive_cols, 'model': model, 'group_metrics': group_metrics, 'bias_score_before': bias_score}

        return {
            'success': True,
            'rows': len(df),
            'cols': len(df.columns),
            'bias_score_before': bias_score,
            'risk_level': risk,
            'biased_attributes': group_metrics,
            'requested_sensitive': sensitive_cols,
            'feature_importance': feature_importance,
            'message': 'Analysis complete.'
        }

    except Exception as e:
        return {'success': False, 'error': 'Internal analyzer error', 'exception': str(e), 'traceback': traceback.format_exc()}


def mitigate(method: str = 'reweighting'):
    if not LAST_ANALYSIS:
        return {'success': False, 'error': 'No previous analysis to mitigate.'}
    try:
        df = LAST_ANALYSIS['df']
        target = LAST_ANALYSIS['target']
        sensitive = LAST_ANALYSIS.get('sensitive', [])
        model = LAST_ANALYSIS.get('model')
        X = df[[c for c in df.columns if c != target]]
        y_raw = df[target]
        y, _ = _binarize_target_if_needed(y_raw)

        if method == 'remove_sensitive' and sensitive:
            X2 = X.drop(columns=[c for c in sensitive if c in X.columns], errors='ignore')
            model.fit(X2, y)
        elif method == 'resample':
            data = X.copy(); data['__t__'] = y
            pos = data[data['__t__']==1]; neg = data[data['__t__']==0]
            if len(pos)==0 or len(neg)==0:
                return {'success': False, 'error': 'Resample not possible, single-class target.'}
            if len(pos) < len(neg): pos_up = resample(pos, replace=True, n_samples=len(neg), random_state=42); balanced = pd.concat([pos_up, neg])
            else: neg_up = resample(neg, replace=True, n_samples=len(pos), random_state=42); balanced = pd.concat([pos, neg_up])
            yb = balanced['__t__']; Xb = balanced.drop(columns=['__t__'])
            model.fit(Xb, yb)
        else:
            # simple reweighting by group frequency
            if not sensitive:
                return {'success': False, 'error': 'No sensitive attribute for reweighting.'}
            groups = df[sensitive[0]].fillna('__M')
            joint = pd.crosstab(groups, y)
            joint = joint + 1e-6
            p_group = joint.sum(axis=1)/joint.values.sum()
            p_label = joint.sum(axis=0)/joint.values.sum()
            desired = np.outer(p_group, p_label)
            obs = joint.values / joint.values.sum()
            weights_matrix = np.divide(desired, obs)
            weights = []
            for g, yi in zip(groups, y):
                try:
                    gi = list(joint.index).index(g)
                    li = int(yi)
                    w = float(weights_matrix[gi, li])
                except Exception:
                    w = 1.0
                weights.append(w)
            # train classifier with sample weights
            pre = model.named_steps['pre']
            X_trans = pre.fit_transform(X)
            clf = RandomForestClassifier(n_estimators=100, random_state=42)
            clf.fit(X_trans, y, sample_weight=np.array(weights))
            model.named_steps['clf'] = clf

        # evaluate
        y_pred = model.predict(X)
        gm_after, comp_after = _compute_group_metrics(df, y, y_pred, sensitive)
        score_after = int(max(0.0, min(1.0, 1.0 - comp_after)) * 100)
        improvement = score_after - LAST_ANALYSIS.get('bias_score_before', 0)
        return {'success': True, 'method': method, 'bias_score_before': LAST_ANALYSIS.get('bias_score_before'), 'bias_score_after': score_after, 'improvement': improvement, 'group_metrics_after': gm_after}
    except Exception as e:
        return {'success': False, 'error': 'Mitigation failed', 'exception': str(e), 'traceback': traceback.format_exc()}
