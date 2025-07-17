import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import json

# --- 1. আপনার Firebase Service Account Key এর সঠিক পথ ---
# এই ফাইলটি আপনি Firebase Console থেকে ডাউনলোড করেছেন এবং আপনার প্রোজেক্টের রুটে আপলোড করেছেন।
SERVICE_ACCOUNT_KEY_PATH = 'greenbagscannerapp-firebase-adminsdk-fbsvc-bb79c0cf95.json'

# --- 2. আপনার Firebase Realtime Database URL ---
DATABASE_URL = 'https://greenbagscannerapp-a5d43-default-rtdb.firebaseio.com/'

# Firebase অ্যাডমিন SDK শুরু করুন
try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': DATABASE_URL
    })
    print("Firebase SDK সফলভাবে শুরু হয়েছে।")
except Exception as e:
    print(f"Firebase SDK শুরু করার সময় ত্রুটি হয়েছে: {e}")
    print("অনুগ্রহ করে নিশ্চিত করুন যে সার্ভিস অ্যাকাউন্ট কী ফাইলের নাম সঠিক আছে এবং ফাইলটি স্ক্রিপ্টের একই ডিরেক্টরিতে আছে।")
    exit()

# --- 3. আপনার বৈধ QR কোডগুলোর তালিকা তৈরি করুন ---
# এখানে আপনার অ্যাপ দ্বারা বৈধ হিসাবে স্ক্যান করতে চান এমন সমস্ত QR কোড যোগ করা আছে।
valid_qr_codes_list = [
    "BAG-20250001",
    "BAG-20250002",
    "BAG-20250003",
    "GREENBAG-123",
    "TEST_QR_CODE",
    # আপনি চাইলে এখানে আরও QR কোড যোগ করতে পারেন।
    # যেমন: "ANOTHER_CODE_XYZ", "BAG-SAMPLE-001"
]

# ডেটাবেসে আপলোড করার জন্য একটি JSON কাঠামো তৈরি করুন
json_output_data = {
    "valid_qr_codes": valid_qr_codes_list
}

try:
    # ডেটাবেসের 'valid_qr_codes' নোডে ডেটা সেট করুন
    ref = db.reference('/valid_qr_codes')
    ref.set(json_output_data["valid_qr_codes"]) # সরাসরি তালিকা সেট করুন

    print("QR কোড ডেটা সফলভাবে Firebase Realtime Database-এ আপলোড করা হয়েছে।")
    print("আপলোড করা ডেটা:")
    print(json.dumps(json_output_data, indent=2))
except Exception as e:
    print(f"QR কোড ডেটা আপলোড করার সময় ত্রুটি হয়েছে: {e}")