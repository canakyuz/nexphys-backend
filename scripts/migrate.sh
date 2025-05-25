#!/bin/bash

SCHEMA=$1
ACTION=$2
NAME=$3

if [ -z "$SCHEMA" ] || [ -z "$ACTION" ]; then
    echo "❌ Schema and action are required"
    echo "Usage: ./scripts/migrate.sh [public|tenant] [generate|run|revert] [migration-name]"
    exit 1
fi

case $SCHEMA in
    "public")
        case $ACTION in
            "generate")
                if [ -z "$NAME" ]; then
                    echo "❌ Migration name is required for generate"
                    exit 1
                fi
                echo "📝 Generating public migration: $NAME"
                npm run migration:generate:public -- "$NAME"
                ;;
            "run")
                echo "🔄 Running public migrations..."
                npm run migration:run:public
                ;;
            "revert")
                echo "⏪ Reverting last public migration..."
                npm run migration:revert:public
                ;;
            *)
                echo "❌ Invalid action for public schema"
                exit 1
                ;;
        esac
        ;;
    "tenant")
        case $ACTION in
            "generate")
                if [ -z "$NAME" ]; then
                    echo "❌ Migration name is required for generate"
                    exit 1
                fi
                echo "📝 Generating tenant migration: $NAME"
                npm run migration:generate:tenant -- "$NAME"
                ;;
            "run")
                echo "🔄 Running tenant migrations..."
                npm run migration:run:tenant
                ;;
            "revert")
                echo "⏪ Reverting last tenant migration..."
                npm run migration:revert:tenant
                ;;
            *)
                echo "❌ Invalid action for tenant schema"
                exit 1
                ;;
        esac
        ;;
    *)
        echo "❌ Invalid schema. Use 'public' or 'tenant'"
        exit 1
        ;;
esac
