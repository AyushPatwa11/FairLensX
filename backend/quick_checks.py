import json
import os
from services import profile_simulator, bias_language_analyzer


def run_simulator_check():
    # Use sample profile values matching test_analyzer dataset
    res = profile_simulator.simulate(
        experience=4,
        education='Bachelors',
        orig_gender='Female',
        cf_gender='Male',
        scenario='Hiring',
        age_group='30-50'
    )
    print('=== Profile Simulator Check ===')
    print(json.dumps(res, indent=2))


def run_jd_fallback_check():
    text = "We are hiring a young, energetic salesperson. Must be able to lift and move boxes."
    res = bias_language_analyzer.rule_based_fallback(text, domain='Hiring', error_msg='test fallback')
    print('\n=== JD Rule-based Fallback Check ===')
    print(json.dumps(res, indent=2))


if __name__ == '__main__':
    run_simulator_check()
    run_jd_fallback_check()
