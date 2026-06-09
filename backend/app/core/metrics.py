from collections import Counter

class MetricsTracker:
    def __init__(self):
        self.route_hits = Counter()
        self.sms_attempts = 0
        self.sms_successes = 0
        self.sms_failures = 0

    def record_hit(self, method: str, path: str):
        self.route_hits[f"{method} {path}"] += 1

metrics_tracker = MetricsTracker()
