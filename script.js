document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = (window.FAIRLENS_API_BASE || 'http://127.0.0.1:8001').replace(/\/$/, '');
    const apiUrl = (path) => `${API_BASE_URL}${path}`;

    // Toast Notification System
    const showToast = (message, type = 'error') => {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `<i class="ph ph-${type === 'error' ? 'warning-circle' : 'check-circle'}"></i> <span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    const titles = {
        'dashboard': 'Dashboard',
        'dataset-analyzer': 'Dataset Bias Analyzer',
        'jd-scanner': 'Bias Language Analyzer',
        'profile-simulator': 'Individual Bias Simulator'
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            // Add active class to clicked
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            pageTitle.textContent = titles[targetId];
            // Hide sidebar for the dashboard hero view to create a full-bleed landing
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                if (targetId === 'dashboard') appContainer.classList.add('hero-landing');
                else appContainer.classList.remove('hero-landing');
            }
        });
    });

    // Ensure correct initial layout (hide sidebar for dashboard by default)
    const initialActive = document.querySelector('.nav-item.active');
    const appContainerInit = document.querySelector('.app-container');
    if (initialActive && appContainerInit) {
        const tgt = initialActive.getAttribute('data-target');
        if (tgt === 'dashboard') appContainerInit.classList.add('hero-landing');
    }

    // -------------------------------------------------------------
    // MODE 1: Dataset Analyzer
    // -------------------------------------------------------------
    const csvFileInput = document.getElementById('csv-file-input');
    const datasetResults = document.getElementById('dataset-results');
    const runAnalysisBtn = document.getElementById('run-analysis-btn');
    const analysisDashboard = document.getElementById('analysis-dashboard');
    const applyMitigationBtn = document.getElementById('apply-mitigation-btn');
    const postMitigation = document.getElementById('post-mitigation');

    let currentCsvFile = null;
    csvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            currentCsvFile = e.target.files[0];
            const fileName = currentCsvFile.name;
            const uploadZone = document.getElementById('csv-upload');
            uploadZone.innerHTML = `
                <i class="ph ph-file-csv" style="color: var(--success-color)"></i>
                <h3>${fileName} Uploaded Successfully</h3>
                <p>Ready for analysis.</p>
                <button class="btn btn-outline mt-3" onclick="document.getElementById('csv-file-input').click()">Replace File</button>
            `;

            // Try to read header row and populate mapping selects dynamically
            try {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const text = evt.target.result || '';
                    const firstLine = text.split(/\r?\n/)[0] || '';
                    // Naive CSV header split - works for simple CSVs used by UI
                    const headers = firstLine.split(',').map(h => h.trim()).filter(h => h.length > 0);

                    const targetSelect = document.getElementById('target-map');
                    const sensitiveSelect = document.getElementById('sensitive-map');

                    // Clear existing options
                    targetSelect.innerHTML = '';
                    sensitiveSelect.innerHTML = '';

                    // Helper to add option
                    const addOption = (selectEl, val, label, selected=false, multiple=false) => {
                        const opt = document.createElement('option');
                        opt.value = val;
                        opt.textContent = label;
                        if (selected) opt.selected = true;
                        selectEl.appendChild(opt);
                    };

                    // If no headers parsed, fallback to previous static defaults
                    if (headers.length === 0) {
                        addOption(targetSelect, 'Hired', 'Hired (1/0)');
                        addOption(targetSelect, 'Loan_Approved', 'Loan_Approved');
                        addOption(targetSelect, 'Admitted', 'Admitted');
                        ['Gender','Age','Race','Zip_Code'].forEach(h => addOption(sensitiveSelect, h, h, ['Gender','Age'].includes(h)));
                    } else {
                        // Populate target options from headers
                        headers.forEach(h => {
                            const display = (h.toLowerCase() === 'hired' || /hire/i.test(h)) ? `${h} (1/0)` : h;
                            addOption(targetSelect, h, display);
                        });

                        // Populate sensitive options and preselect common ones
                        const commonSensitive = ['gender','age','race','ethnicity'];
                        headers.forEach(h => {
                            const isSel = commonSensitive.includes(h.toLowerCase());
                            addOption(sensitiveSelect, h, h, isSel);
                        });

                        // Try selecting a sensible default for target: prefer Hired/Employed/Target-like columns
                        const prefer = headers.find(h => /^(hired|employ|target|approved|admit)/i.test(h));
                        if (prefer) {
                            targetSelect.value = prefer;
                        }
                    }

                    datasetResults.classList.remove('hidden');
                    datasetResults.scrollIntoView({ behavior: 'smooth' });
                };
                reader.readAsText(currentCsvFile);
            } catch (err) {
                // If FileReader fails, still show results and let user pick manually
                datasetResults.classList.remove('hidden');
                datasetResults.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    runAnalysisBtn.addEventListener('click', async () => {
        if (!currentCsvFile) {
            showToast('Please upload a CSV file first.');
            return;
        }
        runAnalysisBtn.disabled = true;
        runAnalysisBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Analyzing Metrics...';
        
        try {
            const formData = new FormData();
            formData.append('file', currentCsvFile);
            
            const targetMap = document.getElementById('target-map').value;
            const sensitiveSelect = document.getElementById('sensitive-map');
            const sensitiveMap = Array.from(sensitiveSelect.selectedOptions).map(opt => opt.value);
            
            formData.append('target', targetMap);
            formData.append('sensitive', JSON.stringify(sensitiveMap));
            
            const response = await fetch(apiUrl('/api/dataset/analyze'), {
                method: 'POST',
                body: formData
            });

            let result;
            if (!response.ok) {
                const text = await response.text();
                // Try to parse JSON error, otherwise show raw body
                try {
                    const parsed = JSON.parse(text || '{}');
                    showToast('Analysis failed: ' + (parsed.error || JSON.stringify(parsed)));
                } catch (e) {
                    showToast(`Analysis failed: ${response.status} ${response.statusText}\n${text}`);
                }
                runAnalysisBtn.disabled = false;
                runAnalysisBtn.innerHTML = 'Run Fairness Analysis';
                return;
            }

            try {
                result = await response.json();
            } catch (e) {
                const text = await response.text();
                showToast('Analysis failed: invalid response from server. ' + text);
                runAnalysisBtn.disabled = false;
                runAnalysisBtn.innerHTML = 'Run Fairness Analysis';
                return;
            }

            if (result.success) {
                // Update score with an animated counter for realism
                const scoreCircle = document.querySelector('#analysis-dashboard .score-circle');
                const targetScore = Number(result.score || 0);
                // animate from 0 to targetScore over 800ms
                const duration = 800;
                const start = performance.now();
                function animate(now) {
                    const elapsed = now - start;
                    const pct = Math.min(1, elapsed / duration);
                    const val = Math.round(pct * targetScore);
                    scoreCircle.textContent = val;
                    if (pct < 1) requestAnimationFrame(animate);
                }
                requestAnimationFrame(animate);
                let scoreClass = 'score-low';
                if (result.score > 40) scoreClass = 'score-high';
                else if (result.score > 20) scoreClass = 'score-medium';
                scoreCircle.className = `score-circle ${scoreClass}`;
                
                document.querySelector('#analysis-dashboard .score-details strong').textContent = result.risk;
                
                runAnalysisBtn.disabled = false;
                runAnalysisBtn.innerHTML = 'Analysis Complete';
                analysisDashboard.classList.remove('hidden');
                analysisDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Render detected biases (static/demo details are included by backend)
                const biasesContainerId = 'detected-biases-container';
                let biasesContainer = document.getElementById(biasesContainerId);
                if (!biasesContainer) {
                    biasesContainer = document.createElement('div');
                    biasesContainer.id = biasesContainerId;
                    biasesContainer.style.marginTop = '16px';
                    biasesContainer.style.padding = '16px';
                    biasesContainer.style.background = 'var(--surface-alt)';
                    biasesContainer.style.border = '1px solid var(--border-color)';
                    biasesContainer.style.borderRadius = '8px';
                    document.getElementById('analysis-dashboard').appendChild(biasesContainer);
                }
                biasesContainer.innerHTML = '';
                if (result.detected_biases && result.detected_biases.length > 0) {
                    result.detected_biases.forEach(b => {
                        const card = document.createElement('div');
                        card.style.padding = '12px';
                        card.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
                        card.innerHTML = `<strong style="display:block;color:var(--text-main)">${b.attribute} — ${b.impact}</strong><div style="color:var(--text-muted);font-size:0.95rem;margin-top:6px">${b.explanation}</div>`;
                        biasesContainer.appendChild(card);
                    });
                } else {
                    biasesContainer.innerHTML = '<div style="color:var(--text-muted)">No detected biases to display.</div>';
                }
            } else {
                showToast('Analysis failed: ' + result.error);
                runAnalysisBtn.disabled = false;
                runAnalysisBtn.innerHTML = 'Run Fairness Analysis';
            }
        } catch (err) {
            showToast('Failed to connect to backend API.');
            runAnalysisBtn.disabled = false;
            runAnalysisBtn.innerHTML = 'Run Fairness Analysis';
        }
    });

    // Interactive About panel: show details when an issue is clicked
    const issueItems = document.querySelectorAll('.issue-item');
    const issueDetail = document.getElementById('issue-detail');
    const issueExamples = {
        'gender-pay': 'Example: Shortlisting patterns where male applicants receive more interview invites despite similar qualifications. We surface feature importance and selection rates to explain model behavior.',
        'loan-disparity': 'Example: Loan models that implicitly use ZIP codes as proxies for race or income, leading to systematic denials. We recommend reviewing income and collateral features and applying resampling.',
        'healthcare-access': 'Example: Triage tools prioritizing patients based on historical utilization, disadvantaging under-served groups. We suggest context-aware rule checks and fairness constraints.',
        'admissions-bias': 'Example: Admissions models that weigh alumni connections or attended schools heavily. Consider removing proxy features and reweighting samples.'
    };
    issueItems.forEach(it => {
        it.style.cursor = 'pointer';
        it.addEventListener('click', () => {
            const key = it.getAttribute('data-issue');
            const text = issueExamples[key] || 'More details coming soon.';
            issueDetail.style.display = 'block';
            issueDetail.innerHTML = `<strong>${it.textContent}</strong><div style="margin-top:8px;color:var(--text-muted)">${text}</div>`;
            issueDetail.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Hero video controls
    window.toggleHeroVideo = function() {
        const vid = document.getElementById('hero-video');
        if (!vid) return;
        if (vid.paused) {
            vid.play().catch(() => {});
        } else {
            vid.pause();
        }
    };

    // Hero intro animation (fade-in headline)
    const hero = document.getElementById('site-hero');
    if (hero) {
        setTimeout(() => {
            hero.classList.add('entered');
        }, 200);
    }

    applyMitigationBtn.addEventListener('click', async () => {
        applyMitigationBtn.disabled = true;
        applyMitigationBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Applying Reweighing...';
        
        try {
            const response = await fetch(apiUrl('/api/dataset/mitigate'), { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                const newScoreCircle = document.querySelector('#post-mitigation .score-circle');
                newScoreCircle.textContent = result.new_score;
                
                document.querySelector('#post-mitigation .score-details p').textContent = `Reduced by ${result.reduction} points`;
                
                applyMitigationBtn.disabled = false;
                applyMitigationBtn.innerHTML = 'Mitigation Applied';
                postMitigation.classList.remove('hidden');
            }
        } catch (err) {
            showToast('Failed to apply mitigation.');
            applyMitigationBtn.disabled = false;
            applyMitigationBtn.innerHTML = 'Apply & Re-evaluate';
        }
    });

    // -------------------------------------------------------------
    // MODE 2: JD Scanner
    // -------------------------------------------------------------
    const scanJdBtn = document.getElementById('scan-jd-btn');
    const jdInput = document.getElementById('jd-input');
    const jdResults = document.getElementById('jd-results');
    // 'issues-list' is the container in the HTML for suggestions
    const suggestionsList = document.getElementById('issues-list');

    // Note: Dictionary now moved to Python backend.

    scanJdBtn.addEventListener('click', async () => {
        console.log('🔍 Bias Analyzer initialized');
        const text = jdInput.value.trim();
        if(!text) {
            showToast('Please paste a document first.');
            return;
        }
        
        const domain = document.getElementById('analyzer-domain').value;
        const contextStr = document.getElementById('analyzer-context').value.trim();
        const allowPhysical = document.getElementById('analyzer-allow-physical').checked;

        scanJdBtn.disabled = true;
        scanJdBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Scanning...';

        try {
            const formData = new FormData();
            formData.append('text', text);
            formData.append('domain', domain);
            
            const contextRules = {
                allow_physical_constraints: allowPhysical
            };
            if (contextStr) {
                contextRules.role_or_policy_context = contextStr;
            }
            formData.append('context_rules', JSON.stringify(contextRules));
            
            const response = await fetch(apiUrl('/api/jd/scan'), {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'API returned success=false');
            }
            
            if (result.success) {
                let suggestionsHTML = '';
                
                // Build issues list
                if (result.issues && result.issues.length > 0) {
                    result.issues.forEach(issue => {
                        let badgeClass = "badge-warning";
                        if (issue.severity === "High") badgeClass = "badge-danger";
                        if (issue.severity === "Low") badgeClass = "badge-primary";
                        
                        let sugs = (issue.suggestions || []).join(", ");
                        
                        suggestionsHTML += `
                            <div class="suggestion-card" style="padding: 16px; border-left: 4px solid var(--warning-color); background: var(--surface-color);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <strong style="color: var(--text-main); font-size: 1.1rem;">"${issue.highlight_phrase}"</strong>
                                    <span class="badge ${badgeClass}">${issue.severity} Severity</span>
                                </div>
                                <div class="text-sm mb-2"><strong style="color: var(--primary-color);">${issue.bias_type} Issue:</strong> ${issue.explanation}</div>
                                <div class="text-sm"><strong>Suggestions:</strong> ${sugs || "None"}</div>
                            </div>
                        `;
                    });
                } else {
                    suggestionsHTML = '<div class="alert alert-success">No significant bias detected.</div>';
                }
                
                suggestionsList.innerHTML = suggestionsHTML;
                
                // Render rewritten text
                document.getElementById('rewritten-text-output').textContent = result.rewritten_text || "No rewritten text provided.";
                
                // Render notes if any
                const notesContainer = document.getElementById('analyzer-notes-container');
                if (result.notes && result.notes.length > 0) {
                    notesContainer.innerHTML = result.notes.map(n => `<div class="alert alert-info" style="margin-bottom: 8px;"><i class="ph ph-info"></i> ${n}</div>`).join('');
                } else {
                    notesContainer.innerHTML = '';
                }
                    // Show prompt/context bias analysis if present
                    if (result.prompt_bias_analysis && result.prompt_bias_analysis.length > 0) {
                        const promptNotes = result.prompt_bias_analysis.map(pb => `<div class="alert alert-warning" style="margin-bottom: 8px;"><i class="ph ph-warning"></i> <strong>Context Flag:</strong> ${pb.explanation}</div>`).join('');
                        notesContainer.innerHTML = (notesContainer.innerHTML || '') + promptNotes;
                    }
                
                jdResults.classList.remove('hidden');
                
                const jdScoreCircle = document.getElementById('jd-score-circle');
                jdScoreCircle.textContent = result.bias_score || 0;
                
                let circleClass = 'score-low';
                if(result.risk_level === 'High Risk' || result.risk_level === 'High') circleClass = 'score-high';
                else if(result.risk_level === 'Medium Risk' || result.risk_level === 'Medium') circleClass = 'score-medium';
                jdScoreCircle.className = `score-circle ${circleClass}`;
                
                document.getElementById('jd-risk-level').textContent = result.risk_level || "Unknown";
                if(result.risk_level === 'High Risk' || result.risk_level === 'High') document.getElementById('jd-risk-level').style.color = 'var(--danger-color)';
                else if(result.risk_level === 'Medium Risk' || result.risk_level === 'Medium') document.getElementById('jd-risk-level').style.color = 'var(--warning-color)';
                else document.getElementById('jd-risk-level').style.color = 'var(--success-color)';

                // Update LLM availability badge
                const llmBadge = document.getElementById('llm-badge');
                if (typeof result.llm_available !== 'undefined') {
                    if (result.llm_available) {
                        llmBadge.textContent = 'LLM: Available';
                        llmBadge.style.background = 'var(--success-color)';
                        llmBadge.style.color = '#fff';
                    } else {
                        llmBadge.textContent = 'LLM: Unavailable (fallback)';
                        llmBadge.style.background = 'var(--warning-color)';
                        llmBadge.style.color = '#000';
                    }
                } else {
                    llmBadge.textContent = 'LLM: Unknown';
                    llmBadge.style.background = 'var(--surface-color)';
                    llmBadge.style.color = 'var(--text-muted)';
                }

                // Count biases by type from issues array
                let genderCount = 0, ageCount = 0, disabilityCount = 0, religionCount = 0, 
                    familyCount = 0, physicalCount = 0, socioEconomicCount = 0, culturalCount = 0, 
                    healthCount = 0, casteCount = 0, appearanceCount = 0;
                
                if (result.issues) {
                    result.issues.forEach(issue => {
                        const type = (issue.bias_type || '').toLowerCase();
                        if (type.includes('gender')) genderCount++;
                        if (type.includes('age')) ageCount++;
                        if (type.includes('disability')) disabilityCount++;
                        if (type.includes('religion')) religionCount++;
                        if (type.includes('family')) familyCount++;
                        if (type.includes('physical') || type.includes('appearance') || type.includes('height') || type.includes('weight')) physicalCount++;
                        if (type.includes('socio') || type.includes('economic') || type.includes('elite')) socioEconomicCount++;
                        if (type.includes('cultural') || type.includes('nation')) culturalCount++;
                        if (type.includes('health')) healthCount++;
                        if (type.includes('caste') || type.includes('class')) casteCount++;
                    });
                }
                document.getElementById('gb-count').textContent = genderCount;
                document.getElementById('ab-count').textContent = ageCount;
                document.getElementById('db-count').textContent = disabilityCount;
                document.getElementById('rb-count').textContent = religionCount;
                document.getElementById('fb-count').textContent = familyCount;
                document.getElementById('pb-count').textContent = physicalCount;
                document.getElementById('seb-count').textContent = socioEconomicCount;
                document.getElementById('cb-count').textContent = culturalCount;
                document.getElementById('hb-count').textContent = healthCount;
                document.getElementById('casteb-count').textContent = casteCount;
                document.getElementById('appb-count').textContent = appearanceCount;
                // Show significance and confidence if present
                const sigEl = document.getElementById('jd-significance');
                const confEl = document.getElementById('jd-confidence');
                if (typeof result.significance !== 'undefined') sigEl.textContent = result.significance;
                else sigEl.textContent = result.bias_score || 0;
                if (typeof result.confidence !== 'undefined') confEl.textContent = result.confidence;
                else confEl.textContent = (result.llm_available ? 85 : 60);
            }
        } catch (err) {
            console.error('❌ Scanner Error:', err);
            showToast('Failed to analyze document.\\n\\nError: ' + (err.message || 'Unknown error'));
        } finally {
            scanJdBtn.disabled = false;
            scanJdBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> Analyze Again';
        }
    });

    // -------------------------------------------------------------
    // MODE 3: Profile Simulator
    // -------------------------------------------------------------
    const simulateBtn = document.getElementById('simulate-btn');
    const simResultsCards = document.getElementById('sim-results-cards');

    simulateBtn.addEventListener('click', async () => {
        simulateBtn.disabled = true;
        simulateBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Running Counterfactuals...';

        const origGender = document.getElementById('sim-gender').value;
        const cfGender = document.getElementById('sim-gender-cf').value;
        const experience = document.getElementById('sim-experience').value || 4;
        const education = document.getElementById('sim-education').value || 'Bachelors';
        const scenario = document.getElementById('sim-scenario').value || 'Hiring';
        const ageGroup = document.getElementById('sim-age').value || '30-50';

        try {
            const formData = new FormData();
            formData.append('experience', experience);
            formData.append('education', education);
            formData.append('orig_gender', origGender);
            formData.append('cf_gender', cfGender);
            formData.append('scenario', scenario);
            formData.append('age_group', ageGroup);

            const response = await fetch(apiUrl('/api/profile/simulate'), {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'API returned success=false');
            }
            
            if (result.success) {
                document.getElementById('res-orig-gender').textContent = origGender;
                document.getElementById('res-cf-gender').textContent = cfGender;
                document.getElementById('exp-orig').textContent = origGender;
                document.getElementById('exp-cf').textContent = cfGender;
                
                // Get probabilities from counterfactual_analysis
                const analysis = result.counterfactual_analysis || {};
                const origProb = analysis.original_prediction || 0;
                const cfProb = analysis.counterfactual_prediction || 0;
                const difference = Math.abs(analysis.difference) || 0;
                
                document.querySelector('.cf-card.original .cf-score').textContent = `${origProb.toFixed(1)}%`;
                document.querySelector('.cf-card.counterfactual .cf-score').textContent = `${cfProb.toFixed(1)}%`;
                
                const diffText = difference > 0 ? `${difference.toFixed(1)}% difference` : `${difference.toFixed(1)}% difference`;
                document.querySelector('.bias-impact-alert p strong').textContent = diffText;
                const impactTitle = document.querySelector('.bias-impact-alert .alert strong');
                impactTitle.textContent = difference >= 20 ? 'Severe Bias Impact Detected' : 'Bias Impact Detected';

                simResultsCards.classList.remove('hidden');
                document.querySelector('#simulator-results h3').style.opacity = '1';
                
                // Scroll to results
                document.getElementById('simulator-results').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Simulation Error:', err);
            showToast('Simulation failed: ' + (err.message || 'Unknown error'));
        } finally {
            simulateBtn.disabled = false;
            simulateBtn.innerHTML = 'Run Simulation';
        }
    });

    // -------------------------------------------------------------
    // Chatbot Logic
    // -------------------------------------------------------------
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotPanel = document.getElementById('chatbot-panel');
    const chatbotInput = document.getElementById('chatbot-input-field');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');

    const toggleChatbot = () => chatbotPanel.classList.toggle('hidden');
    chatbotToggle.addEventListener('click', toggleChatbot);
    chatbotClose.addEventListener('click', toggleChatbot);

    chatbotSend.addEventListener('click', async () => {
        const text = chatbotInput.value.trim();
        if (!text) return;

        // Add user message
        chatbotMessages.innerHTML += `<div class="message user">${text}</div>`;
        chatbotInput.value = '';
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        // Add typing indicator
        const typingId = 'typing-' + Date.now();
        chatbotMessages.innerHTML += `<div id="${typingId}" class="message ai"><i class="ph ph-spinner ph-spin"></i> Thinking...</div>`;
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        try {
            const formData = new FormData();
            formData.append('message', text);

            const response = await fetch(apiUrl('/api/agent/chat'), {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            document.getElementById(typingId).remove();
            
            if (result.success) {
                // simple markdown to html for bold text
                let formattedReply = result.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                chatbotMessages.innerHTML += `<div class="message ai">${formattedReply}</div>`;
            } else {
                chatbotMessages.innerHTML += `<div class="message ai">Error: ${result.error}</div>`;
            }
        } catch (err) {
            document.getElementById(typingId).remove();
            chatbotMessages.innerHTML += `<div class="message ai" style="color: var(--danger-color)">API connection failed. Make sure Backend is running.</div>`;
        }
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    });

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') chatbotSend.click();
    });
});
