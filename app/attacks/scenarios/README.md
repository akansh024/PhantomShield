PhantomShield Attack Simulation Suite

This directory contains controlled attack simulations designed to test PhantomShield’s post-authentication behavioral detection system.

These scripts simulate realistic attacker behavior patterns after successful login and are used to validate detection accuracy, routing logic, and forensic logging.

These are controlled testing tools intended only for environments you own.

Purpose

The attack simulations are used to:

Validate rule-based detection logic

Evaluate behavioral feature extraction

Test routing decisions (Real vs Decoy)

Validate forensic logging in MongoDB

Measure false positives and detection sensitivity

Scenarios
1. api_enumeration.py

Simulates:

High route diversity

Moderate request rate

Post-login API mapping behavior

Behavioral intent:

Trigger route_diversity rule

Potentially trigger request_rate rule

Test enumeration detection logic

Generate broad forensic logs

Expected system behavior:

Elevated risk delta

Possible routing to decoy

Forensic timeline showing wide endpoint exploration

2. sensitive_probe.py

Simulates:

Repeated access to sensitive endpoints

Moderate delays between requests

Occasional canary trap access

Behavioral intent:

Trigger sensitive_ratio rule

Trigger canary detection

Avoid request_rate detection

Expected system behavior:

Elevated risk delta

Canary alerts if triggered

Potential routing to decoy

3. slow_attacker.py

Simulates:

Low request rate (2–5 second delays)

80% normal endpoints

20% light sensitive endpoints

High interval variance

No brute force attempts

No aggressive enumeration

Behavioral intent:

Test risk decay logic

Test long-term monitoring

Attempt to evade rule-based detection

Mimic human browsing behavior

Expected system behavior:

Low to moderate risk delta

No immediate decoy routing

Gradual behavioral monitoring

Minimal false positives

Running the Simulations

Example usage:

python api_enumeration.py http://localhost:8000
python sensitive_probe.py http://localhost:8000 --requests 50
python slow_attacker.py http://localhost:8000 --requests 30


Optional flag for local/self-signed environments:

--no-verify

What to Monitor During Testing

When running attack simulations, monitor:

BehaviorCollector snapshots

Extracted behavioral features

Rule engine risk delta

Final routing decision

Forensic logs stored in MongoDB

Risk decay behavior over time

Recommended Testing Order

Run api_enumeration.py and verify route diversity detection

Run sensitive_probe.py and verify sensitive_ratio and canary detection

Run slow_attacker.py and verify absence of false positives

Adjust thresholds and rule weights if required

Evaluation Checklist

For each attack scenario confirm:

Expected features are generated

Correct rules activate

Risk score behaves logically

Decoy routing triggers appropriately

Forensic logs are complete and structured

If system behavior does not match expectation, review:

Threshold values

Rule weights

Risk decay configuration

Canary detection sensitivity
