import logging

logging.getLogger().setLevel(logging.INFO)


def handler(event, _):
    logging.info(f"Date: {event.get('date')}")
