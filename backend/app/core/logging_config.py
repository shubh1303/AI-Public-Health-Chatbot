import json
import logging
from datetime import datetime, timezone

class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        
        # Include exception trace if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        # Include any extra attributes passed to the logger
        for key, val in record.__dict__.items():
            if key not in {
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "levelname", "levelno", "lineno", "module", "msecs",
                "msg", "name", "pathname", "process", "processName",
                "relativeCreated", "stack_info", "thread", "threadName"
            }:
                # Ensure JSON serializable
                try:
                    json.dumps(val)
                    log_record[key] = val
                except (TypeError, OverflowError):
                    log_record[key] = str(val)
                    
        return json.dumps(log_record)

def setup_logging():
    # Configure root logger
    root_logger = logging.getLogger()
    
    # Remove existing handlers to prevent duplicate output
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    # Create console handler using StructuredFormatter
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    
    # Configure uvicorn loggers to use the same structured handler
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "app.main", "app.services.twilio_client"):
        logger = logging.getLogger(logger_name)
        logger.handlers = []
        logger.propagate = True
