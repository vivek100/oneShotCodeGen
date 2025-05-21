"""
Standalone test for datetime JSON serialization
"""

import json
from datetime import datetime, date, UTC

# Custom JSON encoder for datetime objects
class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime and date objects"""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def test_datetime_serialization():
    """Test serializing datetime objects"""
    print("Running datetime serialization test...")
    now = datetime.now(UTC)
    data = {"timestamp": now, "name": "Test"}
    print(f"Test data: timestamp={now}, name=Test")
    
    try:
        # Without the DateTimeEncoder, this would fail
        serialized = json.dumps(data, cls=DateTimeEncoder)
        print(f"Serialized datetime: {serialized}")
        
        # Parse it back
        parsed = json.loads(serialized)
        print(f"Parsed datetime: {parsed}")
        assert parsed["name"] == "Test"
        assert parsed["timestamp"] == now.isoformat()
        print("✅ Datetime serialization test passed")
        return True
    except Exception as e:
        print(f"❌ Datetime serialization test failed: {str(e)}")
        return False

def test_date_serialization():
    """Test serializing date objects"""
    print("Running date serialization test...")
    today = date.today()
    data = {"date": today, "name": "Test"}
    print(f"Test data: date={today}, name=Test")
    
    try:
        serialized = json.dumps(data, cls=DateTimeEncoder)
        print(f"Serialized date: {serialized}")
        
        # Parse it back
        parsed = json.loads(serialized)
        print(f"Parsed date: {parsed}")
        assert parsed["name"] == "Test"
        assert parsed["date"] == today.isoformat()
        print("✅ Date serialization test passed")
        return True
    except Exception as e:
        print(f"❌ Date serialization test failed: {str(e)}")
        return False

def test_nested_datetime():
    """Test serializing nested datetime objects"""
    print("Running nested datetime serialization test...")
    now = datetime.now(UTC)
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
    print(f"Test data: complex nested structure with datetime objects")
    
    try:
        # Should serialize without errors
        serialized = json.dumps(data, cls=DateTimeEncoder)
        print(f"Serialized nested data (truncated): {serialized[:100]}...")
        
        # Parse it back
        parsed = json.loads(serialized)
        assert parsed["metadata"]["created"] == now.isoformat()
        assert parsed["metadata"]["due_date"] == today.isoformat()
        assert parsed["items"][0]["timestamp"] == now.isoformat()
        assert parsed["items"][1]["timestamp"] == now.isoformat()
        print("✅ Nested datetime serialization test passed")
        return True
    except Exception as e:
        print(f"❌ Nested datetime serialization test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Testing DateTimeEncoder ===")
    success = True
    
    success = test_datetime_serialization() and success
    print("\n" + "-"*50 + "\n")
    
    success = test_date_serialization() and success
    print("\n" + "-"*50 + "\n")
    
    success = test_nested_datetime() and success
    print("\n" + "-"*50 + "\n")
    
    if success:
        print("🎉 All tests passed! Your DateTimeEncoder is working correctly.")
    else:
        print("❌ Some tests failed. Check the errors above.") 