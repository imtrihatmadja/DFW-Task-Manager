#!/bin/bash
sed -i 's/allow write: if request.auth != null && request.auth.uid == userId;/allow write: if request.auth != null \&\& (request.auth.uid == userId || isAdmin());/g' firestore.rules
