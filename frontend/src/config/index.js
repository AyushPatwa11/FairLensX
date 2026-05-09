// FairLens AI — Themes Configuration
export const THEMES = [
  { id: 'dark',     label: 'Dark',     emoji: '🌙', bg: '#0d1117', accent: '#3b82f6' },
  { id: 'light',    label: 'Light',    emoji: '☀️', bg: '#f8fafc', accent: '#2563eb' },
  { id: 'ocean',    label: 'Ocean',    emoji: '🌊', bg: '#061322', accent: '#38bdf8' },
  { id: 'forest',   label: 'Forest',   emoji: '🌿', bg: '#0a1a0a', accent: '#22c55e' },
  { id: 'sunset',   label: 'Sunset',   emoji: '🌅', bg: '#1a0a0a', accent: '#f97316' },
  { id: 'purple',   label: 'Purple',   emoji: '💜', bg: '#0e0a1a', accent: '#a855f7' },
  { id: 'midnight', label: 'Midnight', emoji: '✨', bg: '#000000', accent: '#60a5fa' },
  { id: 'rose',     label: 'Rose',     emoji: '🌹', bg: '#0f0a0d', accent: '#fb7185' },
];

// Domain-specific configuration
export const DOMAIN_CONFIG = {
  hiring: {
    label: 'Hiring & Recruitment',
    outcomeLabels: ['Hired', 'Not Hired'],
    targetSuggestions: ['hired', 'selected', 'promoted', 'approved', 'label', 'outcome'],
    sensitiveSuggestions: ['gender', 'race', 'age', 'ethnicity', 'nationality', 'religion'],
    sampleText: `We are seeking a young, energetic go-getter to join our fast-paced team. The ideal salesman will possess a native-level command of English and be willing to work long hours. This role requires someone with a masculine drive to succeed. We value candidates who are culturally aligned with our existing team and headcount.`,
  },
  loan: {
    label: 'Loan & Credit',
    outcomeLabels: ['Loan Approved', 'Loan Denied'],
    targetSuggestions: ['approved', 'loan_status', 'default', 'label', 'outcome'],
    sensitiveSuggestions: ['gender', 'race', 'age', 'zipcode', 'marital_status'],
    sampleText: `We prefer applicants who are heads of household with stable family backgrounds. Ideal borrowers are native-born citizens with long-term residency history. Single applicants may face additional scrutiny during the review process. Private insurance holders are prioritized for expedited processing.`,
  },
  healthcare: {
    label: 'Healthcare',
    outcomeLabels: ['Referred', 'Not Referred'],
    targetSuggestions: ['referred', 'treated', 'admitted', 'outcome', 'label'],
    sensitiveSuggestions: ['gender', 'race', 'age', 'insurance', 'insurance_type'],
    sampleText: `Priority access is given to working adults with private insurance coverage. Patients must be English proficient and capable of independent decision-making. Elderly patients with complex needs may experience extended wait times. Able-bodied patients typically see faster triage outcomes.`,
  },
  education: {
    label: 'Education',
    outcomeLabels: ['Admitted', 'Not Admitted'],
    targetSuggestions: ['admitted', 'scholarship', 'selected', 'label', 'outcome'],
    sensitiveSuggestions: ['gender', 'race', 'income', 'zipcode', 'first_generation'],
    sampleText: `We seek academically exceptional students from prestigious educational backgrounds. Legacy applicants and those from traditional families are strongly encouraged to apply. We value cultural alignment with our institution. Young, dynamic students who demonstrate a go-getter attitude will be prioritized.`,
  },
};

// Simulator form fields per domain
export const SIMULATOR_FORMS = {
  hiring: {
    fields: [
      { key: 'gender',     label: 'Gender',             type: 'select', options: ['Male','Female','Non-binary'], sensitive: true },
      { key: 'race',       label: 'Race / Ethnicity',    type: 'select', options: ['White','Black','Hispanic','Asian','Other'], sensitive: true },
      { key: 'age',        label: 'Age',                 type: 'number', min: 18, max: 65, defaultVal: 30, sensitive: true },
      { key: 'education',  label: 'Education Level',     type: 'select', options: ['High School','Bachelors','Masters','PhD'] },
      { key: 'experience', label: 'Years Experience',    type: 'number', min: 0, max: 40, defaultVal: 5 },
      { key: 'gpa',        label: 'GPA (0–4.0)',         type: 'number', min: 0, max: 4.0, defaultVal: 3.2, step: 0.1 },
    ],
  },
  loan: {
    fields: [
      { key: 'gender',       label: 'Gender',           type: 'select', options: ['Male','Female','Non-binary'], sensitive: true },
      { key: 'race',         label: 'Race / Ethnicity', type: 'select', options: ['White','Black','Hispanic','Asian','Other'], sensitive: true },
      { key: 'age',          label: 'Age',              type: 'number', min: 18, max: 80, defaultVal: 35, sensitive: true },
      { key: 'income',       label: 'Annual Income ($)', type: 'number', min: 10000, max: 500000, defaultVal: 65000 },
      { key: 'credit_score', label: 'Credit Score',     type: 'number', min: 300, max: 850, defaultVal: 680 },
      { key: 'loan_amount',  label: 'Loan Amount ($)',  type: 'number', min: 1000, max: 500000, defaultVal: 50000 },
    ],
  },
  healthcare: {
    fields: [
      { key: 'gender',    label: 'Gender',              type: 'select', options: ['Male','Female'], sensitive: true },
      { key: 'insurance', label: 'Insurance Type',      type: 'select', options: ['Private','Public','None'], sensitive: true },
      { key: 'age',       label: 'Age',                 type: 'number', min: 1, max: 110, defaultVal: 45, sensitive: true },
      { key: 'bmi',       label: 'BMI',                 type: 'number', min: 10, max: 60, defaultVal: 26, step: 0.1 },
      { key: 'severity',  label: 'Symptom Severity (1-10)', type: 'number', min: 1, max: 10, defaultVal: 6 },
    ],
  },
  education: {
    fields: [
      { key: 'gender',     label: 'Gender',           type: 'select', options: ['Male','Female','Non-binary'], sensitive: true },
      { key: 'race',       label: 'Race / Ethnicity', type: 'select', options: ['White','Black','Hispanic','Asian','Other'], sensitive: true },
      { key: 'income',     label: 'Family Income',    type: 'select', options: ['Low','Medium','High'], sensitive: true },
      { key: 'gpa',        label: 'GPA (0–4.0)',      type: 'number', min: 0, max: 4.0, defaultVal: 3.5, step: 0.1 },
      { key: 'test_score', label: 'Test Score',       type: 'number', min: 400, max: 1600, defaultVal: 1100 },
    ],
  },
};

export const getRiskStyle = (score) => {
  if (score >= 70) return { label: 'High Risk',    chipClass: 'chip-red',    color: 'var(--red)' };
  if (score >= 40) return { label: 'Moderate Risk', chipClass: 'chip-orange', color: 'var(--orange)' };
  return           { label: 'Low Risk',     chipClass: 'chip-green',  color: 'var(--green)' };
};
