# 🔗 Dynamic Email URL Implementation - Complete Guide

## ✅ **Implementation Summary**

All email templates have been successfully updated to use **dynamic `process.env.BASE_URL`** instead of hardcoded `localhost:3000` URLs. This ensures that email links work correctly in both development and production environments.

---

## 📧 **Email Templates Updated**

### 1. **Appointment Booking Emails**
**File:** `backend/controllers/appointmentsController.js`

#### **Psychiatrist Appointment Email:**
```html
<a href="${process.env.BASE_URL}/psychiatryst/appointments" 
   style="background-color: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
  📋 View Appointments
</a>
```

#### **Counselor Appointment Email:**
```html
<a href="${process.env.BASE_URL}/counselor/appointments" 
   style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
  📋 View Appointments
</a>
```

### 2. **Emergency Case Emails**
**File:** `backend/controllers/emergencyCaseController.js`

#### **Professional Assignment Email:**
```html
<a href="${process.env.BASE_URL}/${userType}/${role === 'Counselor' ? 'emergency-reports' : 'emergency-cases'}" 
   style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
  📋 View Emergency Cases
</a>
```

#### **Admin Emergency Notification Email:**
```html
<a href="${process.env.BASE_URL}/admin/manage-emergency" 
   style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
  View Emergency Cases
</a>
```

---

## 🌍 **Environment Configuration**

### **Development Environment:**
```bash
BASE_URL=http://localhost:3000
```

### **Production Environment:**
```bash
BASE_URL=https://caremental.online
```

### **Testing Environment:**
```bash
BASE_URL=https://staging.caremental.online
```

---

## 🧪 **Testing Endpoints**

### **1. Environment Variable Test**
```bash
GET http://localhost:5000/api/notifications/test
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications API is working correctly",
  "timestamp": "2025-01-30T12:00:00.000Z",
  "endpoint": "/api/notifications",
  "environment": {
    "BASE_URL": "http://localhost:3000",
    "NODE_ENV": "development"
  }
}
```

### **2. Email URL Generation Test**
```bash
GET http://localhost:5000/api/notifications/test-email-urls
```

**Response:**
```json
{
  "success": true,
  "message": "Email URL generation test",
  "baseUrl": "http://localhost:3000",
  "generatedUrls": {
    "counselorAppointments": "http://localhost:3000/counselor/appointments",
    "psychiatristAppointments": "http://localhost:3000/psychiatryst/appointments",
    "adminEmergency": "http://localhost:3000/admin/manage-emergency",
    "counselorEmergency": "http://localhost:3000/counselor/emergency-reports",
    "psychiatristEmergency": "http://localhost:3000/psychiatryst/emergency-cases"
  },
  "timestamp": "2025-01-30T12:00:00.000Z"
}
```

---

## 📋 **Complete URL Mapping**

| Email Type | User Role | Generated URL | Purpose |
|------------|-----------|---------------|---------|
| Appointment | Counselor | `${BASE_URL}/counselor/appointments` | View counselor appointments |
| Appointment | Psychiatrist | `${BASE_URL}/psychiatryst/appointments` | View psychiatrist appointments |
| Emergency Assignment | Counselor | `${BASE_URL}/counselor/emergency-reports` | View assigned emergency cases |
| Emergency Assignment | Psychiatrist | `${BASE_URL}/psychiatryst/emergency-cases` | View assigned emergency cases |
| Emergency Notification | Admin | `${BASE_URL}/admin/manage-emergency` | Manage all emergency cases |

---

## ✅ **Verification Checklist**

### **Development Testing:**
- [ ] Set `BASE_URL=http://localhost:3000` in `.env`
- [ ] Book appointment as user public
- [ ] Check email links point to `http://localhost:3000/[role]/appointments`
- [ ] Submit emergency case as user public
- [ ] Check admin email links point to `http://localhost:3000/admin/manage-emergency`
- [ ] Assign emergency case to professional
- [ ] Check professional email links point to correct dashboard

### **Production Testing:**
- [ ] Set `BASE_URL=https://caremental.online` in production `.env`
- [ ] Test appointment booking email links
- [ ] Test emergency case email links
- [ ] Verify all links redirect to live production site
- [ ] Confirm no `localhost` URLs in production emails

---

## 🔧 **Technical Implementation Details**

### **Before (Hardcoded):**
```javascript
// ❌ Old implementation
<a href="http://localhost:3000/counselor/appointments">
<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/counselor/appointments">
```

### **After (Dynamic):**
```javascript
// ✅ New implementation
<a href="${process.env.BASE_URL}/counselor/appointments">
```

### **Key Benefits:**
1. **Environment Flexible**: Works in dev, staging, and production
2. **No Hardcoded URLs**: Clean and maintainable code
3. **Production Ready**: Links work correctly on live domain
4. **Easy Configuration**: Single environment variable controls all URLs

---

## 🚀 **Deployment Instructions**

### **Step 1: Update Environment Variables**
```bash
# In production .env file
BASE_URL=https://caremental.online

# In development .env file  
BASE_URL=http://localhost:3000
```

### **Step 2: Restart Backend Server**
```bash
# Stop the backend
npm stop

# Start with new environment
npm start
```

### **Step 3: Test Email Functionality**
1. Book a test appointment
2. Submit a test emergency case
3. Verify email links redirect correctly
4. Check professional dashboard access

---

## 🔒 **Security Notes**

- **SERVER-SIDE ONLY**: `process.env.BASE_URL` is only used in backend email templates
- **FRONTEND VARIABLES**: Use `NEXT_PUBLIC_BASE_URL` for client-side URLs
- **ENVIRONMENT ISOLATION**: Different BASE_URL for dev/staging/production
- **NO SECRETS**: BASE_URL is not sensitive, safe to log for debugging

---

## 🎯 **Expected Results**

### **Development (localhost:3000):**
- ✅ Appointment emails link to `http://localhost:3000/counselor/appointments`
- ✅ Emergency emails link to `http://localhost:3000/admin/manage-emergency`
- ✅ Professional emails link to `http://localhost:3000/psychiatryst/emergency-cases`

### **Production (caremental.online):**
- ✅ Appointment emails link to `https://caremental.online/counselor/appointments`
- ✅ Emergency emails link to `https://caremental.online/admin/manage-emergency`
- ✅ Professional emails link to `https://caremental.online/psychiatryst/emergency-cases`

---

## 🎉 **Implementation Complete!**

All email templates now use **dynamic `process.env.BASE_URL`** for URL generation. The system will automatically generate the correct URLs based on the environment configuration, ensuring that email links work perfectly in both development and production environments.

**No more hardcoded `localhost:3000` URLs in any email template!** 🚀 