import pandas as pd
import numpy as np

np.random.seed(42)

n_samples = 1000

# Features
experience = np.random.randint(0, 15, size=n_samples)
education = np.random.choice(['Bachelors', 'Masters', 'PhD'], size=n_samples, p=[0.6, 0.3, 0.1])
gender = np.random.choice(['Male', 'Female'], size=n_samples, p=[0.5, 0.5])
age = np.random.choice(['< 30', '30-50', '> 50'], size=n_samples, p=[0.4, 0.5, 0.1])

# Target variable generation (Hired)
# Base logic: More experience + higher education = more likely to be hired.
# Bias injection: Men get a systematic bonus to their log-odds of being hired.

logits = -2.0 + (experience * 0.3)
logits += np.where(education == 'Masters', 1.0, 0)
logits += np.where(education == 'PhD', 2.0, 0)
logits += np.where(gender == 'Male', 2.5, 0) # Massive bias injected

probabilities = 1 / (1 + np.exp(-logits))
hired = np.random.binomial(1, probabilities)

df = pd.DataFrame({
    'Experience': experience,
    'Education': education,
    'Gender': gender,
    'Age': age,
    'Hired': hired
})

df.to_csv("synth_hiring_data.csv", index=False)
print("synth_hiring_data.csv generated successfully.")
