import unittest
import json
import sys
import os
from datetime import datetime, date

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.template_renderer import DateTimeEncoder

class TestDateTimeSerializer(unittest.TestCase):
    """Test cases for datetime serialization"""
    
    def test_datetime_serialization(self):
        """Test serializing datetime objects"""
        now = datetime.utcnow()
        data = {"timestamp": now, "name": "Test"}
        
        # Without the DateTimeEncoder, this would fail
        serialized = json.dumps(data, cls=DateTimeEncoder)
        
        # Verify it's serialized correctly
        self.assertIn('"timestamp":', serialized)
        self.assertIn('"name": "Test"', serialized)
        
        # Parse it back
        parsed = json.loads(serialized)
        self.assertEqual(parsed["name"], "Test")
        self.assertEqual(parsed["timestamp"], now.isoformat())
    
    def test_date_serialization(self):
        """Test serializing date objects"""
        today = date.today()
        data = {"date": today, "name": "Test"}
        
        serialized = json.dumps(data, cls=DateTimeEncoder)
        
        # Verify it's serialized correctly
        self.assertIn('"date":', serialized)
        self.assertIn('"name": "Test"', serialized)
        
        # Parse it back
        parsed = json.loads(serialized)
        self.assertEqual(parsed["name"], "Test")
        self.assertEqual(parsed["date"], today.isoformat())
    
    def test_nested_datetime(self):
        """Test serializing nested datetime objects"""
        now = datetime.utcnow()
        today = date.today()
        
        data = {
            "metadata": {
                "created": now,
                "due_date": today
            },
            "items": [
                {"name": "Item 1", "timestamp": now},
                {"name": "Item 2", "timestamp": now}
            ]
        }
        
        # Should serialize without errors
        serialized = json.dumps(data, cls=DateTimeEncoder)
        
        # Parse it back
        parsed = json.loads(serialized)
        self.assertEqual(parsed["metadata"]["created"], now.isoformat())
        self.assertEqual(parsed["metadata"]["due_date"], today.isoformat())
        self.assertEqual(parsed["items"][0]["timestamp"], now.isoformat())
        self.assertEqual(parsed["items"][1]["timestamp"], now.isoformat())

if __name__ == "__main__":
    unittest.main() 