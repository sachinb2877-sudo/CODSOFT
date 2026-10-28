import pymongo
from datetime import datetime, timezone

uri = 'mongodb+srv://Vercel-Admin-atlas-violet-planet:OBBDUvrBjNg94CbF@atlas-violet-planet.zegnvrm.mongodb.net/Codsoft?retryWrites=true&w=majority'
client = pymongo.MongoClient(uri)
db = client['Codsoft']
coll = db['certificates']

certificates = [
    {
        'id': 'CS/2026/JP/84920',
        'certificateId': 'CS/2026/JP/84920',
        'studentName': 'Mansi Suryawanshi',
        'domain': 'Java Programming Internship',
        'duration': '4 weeks',
        'startingDate': '25 January 2026',
        'awardDate': '25 February 2026',
        'credentialType': 'Internship Completion Record',
        'recordStatus': 'Completed',
        'issuerOrganization': 'CodSoft (Virtual Internship Program)',
        'verificationStatus': 'Record Issued',
        'recordReference': 'IND-REC-202602-0941',
        'updatedAt': datetime.now(timezone.utc)
    },
    {
        'id': 'CS/2026/JP/32816',
        'certificateId': 'CS/2026/JP/32816',
        'studentName': 'Mansi Suryawanshi',
        'domain': 'Java Programming Internship',
        'duration': '4 weeks',
        'startingDate': '25 January 2026',
        'awardDate': '25 February 2026',
        'credentialType': 'Internship Completion Record',
        'recordStatus': 'Completed',
        'issuerOrganization': 'CodSoft (Virtual Internship Program)',
        'verificationStatus': 'Record Issued',
        'recordReference': 'IND-REC-202602-32816',
        'updatedAt': datetime.now(timezone.utc)
    },
    {
        'id': 'CS/2026/VIP/76548',
        'certificateId': 'CS/2026/VIP/76548',
        'studentName': 'Mansi Suryawanshi',
        'domain': 'Virtual Internship Program',
        'duration': '4 weeks',
        'startingDate': '25 January 2026',
        'awardDate': '25 February 2026',
        'credentialType': 'Internship Completion Record',
        'recordStatus': 'Completed',
        'issuerOrganization': 'CodSoft (Virtual Internship Program)',
        'verificationStatus': 'Record Issued',
        'recordReference': 'IND-REC-202602-76548',
        'updatedAt': datetime.now(timezone.utc)
    }
]

for cert in certificates:
    coll.update_one({'id': cert['id']}, {'$set': cert}, upsert=True)

print("SUCCESS: Seeded certificates into MongoDB Atlas successfully!")
count = coll.count_documents({})
print(f"Total certificates in collection 'certificates': {count}")
for c in coll.find({}, {'_id': 0, 'id': 1, 'studentName': 1, 'domain': 1}):
    print(" -", c)
