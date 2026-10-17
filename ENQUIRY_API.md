# Enquiry API

- POST /api/enquiries — public contact submission, rate limited. Required fields: name, email, countryCode (e.g. +91), country, interest, message. Include phone and organisation as strings (empty allowed).
- GET /api/enquiries?page=1&search=&status=new — authenticated admin list with 10 rows per page, statistics and pagination.
- PATCH /api/enquiries/:id — authenticated admin status update: {"status":"new"}, {"status":"in-progress"}, or {"status":"closed"}.

Contact enquiries are stored in MongoDB and shown in admin. No automatic emails are sent. The dashboard API includes total/new enquiry counts. Calling codes come from libphonenumber-js country data; selecting a country updates the phone prefix and users can select another prefix manually.
