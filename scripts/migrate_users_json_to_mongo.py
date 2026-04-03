import json
from datetime import datetime, timezone
from pathlib import Path

from pymongo import MongoClient, UpdateOne

from app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    users_path = Path("app/db/storage/users.json")

    if not users_path.exists():
        print("No users.json file found. Nothing to migrate.")
        return

    users_data = json.loads(users_path.read_text(encoding="utf-8"))
    operations = []

    for email, user in users_data.items():
        operations.append(
            UpdateOne(
                {"email": email},
                {
                    "$setOnInsert": {
                        "name": user.get("name", ""),
                        "email": email,
                        "hashed_password": user.get("hashed_password", ""),
                        "created_at": datetime.now(timezone.utc),
                    }
                },
                upsert=True,
            )
        )

    client = MongoClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=settings.mongodb_timeout_ms,
        connectTimeoutMS=settings.mongodb_timeout_ms,
        socketTimeoutMS=settings.mongodb_timeout_ms,
    )

    try:
        collection = client[settings.mongodb_db_name][settings.mongodb_users_collection]
        collection.create_index([("email", 1)], unique=True, name="users_email_unique")

        if operations:
            result = collection.bulk_write(operations, ordered=False)
            print(
                f"Migrated {len(operations)} users. "
                f"Inserted new users: {result.upserted_count}."
            )
        else:
            print("users.json is empty. Nothing to migrate.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
