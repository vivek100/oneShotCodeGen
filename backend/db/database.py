import os
import logging
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database
from dotenv import load_dotenv
import contextlib
from sqlalchemy.orm import Session as SQLAlchemySession  # Ensure we're using SQLAlchemy's Session

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL from environment variable or use default SQLite path
DATABASE_URL = os.getenv("DB_URL", "sqlite:///./agent.db")

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
metadata = MetaData()

# Databases query builder instance
database = Database(DATABASE_URL)

async def init_db():
    """Initialize the database connection"""
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Created database tables")
        
        # Connect to the database
        if not database.is_connected:
            await database.connect()
            logger.info("Connected to database")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise

async def close_db_connection():
    """Close the database connection when the application shuts down"""
    if database.is_connected:
        await database.disconnect()
        logger.info("Disconnected from database")

@contextlib.asynccontextmanager
async def get_db():
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close() 