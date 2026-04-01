@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Core Truth House API")
    logger.info("Resolved version: %s", resolve_version())

    app.state.startup_ok = False
    app.state.startup_error = None
    app.state.db = None

    try:
        database = await init_db()
        app.state.db = database
        logger.info("Database initialized")

        await init_workspace_db(database)
        logger.info("Workspace indexes initialized")

        await workflow_repository.ensure_indexes()
        logger.info("Workflow indexes ensured")

        await content_pack_repository.ensure_indexes()
        logger.info("Content pack indexes ensured")

        app.state.startup_ok = True

    except Exception as exc:
        app.state.startup_error = str(exc)
        logger.exception("Application startup failed")

    try:
        yield
    finally:
        logger.info("Shutting down Core Truth House API")

        try:
            await close_db()
            logger.info("Database connection closed")
        except Exception:
            logger.exception("Error while closing database connection")

        try:
            if mongo_client is not None:
                mongo_client.close()
                logger.info("Mongo client closed")
        except Exception:
            logger.exception("Error while closing Mongo client")
