# Subsignal API Documentation

Base URL: `https://subsignal.app/api` (Production) or `{{baseURL}}/api` (Development)

## Authentication

Most endpoints require authentication via session cookies. Authentication is handled through the Better Auth system with Google OAuth.

### Authentication Endpoints

#### Sign in with Google

```bash
curl -X GET "{{baseURL}}/api/auth/sign-in/social/google" \
  -H "Accept: application/json"
```

#### Sign out

```bash
curl -X POST "{{baseURL}}/api/auth/sign-out" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

#### Get session

```bash
curl -X GET "{{baseURL}}/api/auth/session" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

---

## Health Endpoints

### Check API Health

```bash
curl -X GET "{{baseURL}}/api/health" \
  -H "Accept: application/json"
```

**Response:**

```json
{
    "status": "ok",
    "service": "subsignal-api",
    "version": "0.0.1",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development"
}
```

### Check Readiness

```bash
curl -X GET "{{baseURL}}/api/health/ready" \
  -H "Accept: application/json"
```

**Response:**

```json
{
    "status": "ready",
    "service": "subsignal-api",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Check Liveness

```bash
curl -X GET "{{baseURL}}/api/health/live" \
  -H "Accept: application/json"
```

**Response:**

```json
{
    "status": "alive",
    "service": "subsignal-api",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Preferences API (v1)

All preference endpoints require authentication.

### Get User Preferences

```bash
curl -X GET "{{baseURL}}/api/v1/preferences" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

### Create/Update User Preferences

```bash
curl -X POST "{{baseURL}}/api/v1/preferences" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "properties": ["pricing", "product", "customer"],
    "frequency": "7_day"
  }'
```

```bash
curl -X PUT "{{baseURL}}/api/v1/preferences" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "properties": ["pricing", "product", "customer", "partnership"],
    "frequency": "1_month"
  }'
```

**Payload Schema:**

- `properties`: Array of strings. Valid values: `"pricing"`, `"product"`, `"customer"`, `"partnership"`, `"branding"`, `"messaging"`
- `frequency`: String. Valid values: `"7_day"`, `"15_day"`, `"1_month"`, `"3_month"`, `"6_month"`

### Delete User Preferences

```bash
curl -X DELETE "{{baseURL}}/api/v1/preferences" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

**Response:**

```json
{
    "success": true
}
```

---

## Companies API (v1)

All company endpoints require authentication.

### Get All Companies (with pagination)

```bash
curl -X GET "{{baseURL}}/api/v1/companies" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

With pagination parameters:

```bash
curl -X GET "{{baseURL}}/api/v1/companies?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

**Query Parameters:**

- `page`: Number (min: 1, default: 1)
- `pageSize`: Number (min: 1, max: 100, default: 10)
- `sortBy`: String (values: `"createdAt"`, `"updatedAt"`, `"name"`, `"title"`, default: `"createdAt"`)
- `sortOrder`: String (values: `"asc"`, `"desc"`, default: `"desc"`)

### Get Specific Company

```bash
curl -X GET "{{baseURL}}/api/v1/companies/{company_id}" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

### Create New Company

```bash
curl -X POST "{{baseURL}}/api/v1/companies" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "name": "Example Company",
    "url": "https://example.com",
    "initialPage": {
      "title": "Homepage",
      "url": "https://example.com"
    }
  }'
```

**Payload Schema:**

- `name`: String (required, min length: 1)
- `url`: String (required, valid URL)
- `initialPage`: Object (required)
    - `title`: String (required, min length: 1)
    - `url`: String (required, valid URL)

### Update Company

```bash
curl -X PATCH "{{baseURL}}/api/v1/companies/{company_id}" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "name": "Updated Company Name",
    "url": "https://updated-example.com"
  }'
```

**Payload Schema:**

- `name`: String (optional, min length: 1)
- `url`: String (optional, valid URL)

### Delete Company

```bash
curl -X DELETE "{{baseURL}}/api/v1/companies/{company_id}" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

---

## Pages API (v1)

All page endpoints require authentication.

### Get All Pages for User (with pagination)

```bash
curl -X GET "{{baseURL}}/api/v1/pages" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

With pagination parameters:

```bash
curl -X GET "{{baseURL}}/api/v1/pages?page=1&pageSize=10&sortBy=title&sortOrder=asc" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

### Get Specific Page

```bash
curl -X GET "{{baseURL}}/api/v1/pages/{page_id}" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

### Get Pages by Company (with pagination)

```bash
curl -X GET "{{baseURL}}/api/v1/pages/company/{company_id}" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

With pagination parameters:

```bash
curl -X GET "{{baseURL}}/api/v1/pages/company/{company_id}?page=1&pageSize=20&sortBy=updatedAt&sortOrder=desc" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

### Create Page with Existing Company

```bash
curl -X POST "{{baseURL}}/api/v1/pages" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "type": "existing",
    "title": "About Us",
    "url": "https://example.com/about",
    "companyId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Create Page with New Company

```bash
curl -X POST "{{baseURL}}/api/v1/pages" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "type": "new",
    "title": "Homepage",
    "url": "https://newcompany.com",
    "newCompany": {
      "name": "New Company",
      "url": "https://newcompany.com"
    }
  }'
```

**Payload Schema for Existing Company:**

- `type`: String (required, value: `"existing"`)
- `title`: String (required, min length: 1)
- `url`: String (required, valid URL)
- `companyId`: String (required, UUID format)

**Payload Schema for New Company:**

- `type`: String (required, value: `"new"`)
- `title`: String (required, min length: 1)
- `url`: String (required, valid URL)
- `newCompany`: Object (required)
    - `name`: String (required, min length: 1)
    - `url`: String (required, valid URL)

### Update Page

```bash
curl -X PATCH "{{baseURL}}/api/v1/pages/{page_id}" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "title": "Updated Page Title",
    "url": "https://updated-example.com/page"
  }'
```

**Payload Schema:**

- `title`: String (optional, min length: 1)
- `url`: String (optional, valid URL)

### Delete Page

```bash
curl -X DELETE "{{baseURL}}/api/v1/pages/{page_id}" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

### Bulk Delete Pages

```bash
curl -X POST "{{baseURL}}/api/v1/pages/bulk-delete" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "pageIds": [
      "123e4567-e89b-12d3-a456-426614174001",
      "123e4567-e89b-12d3-a456-426614174002",
      "123e4567-e89b-12d3-a456-426614174003"
    ]
  }'
```

**Payload Schema:**

- `pageIds`: Array of strings (required, min length: 1, each item must be UUID format)

---

## Common Query Parameters

### Pagination Parameters (for GET requests)

- `page`: Number (min: 1, default: 1) - Page number
- `pageSize`: Number (min: 1, max: 100, default: 10) - Items per page
- `sortBy`: String (values: `"createdAt"`, `"updatedAt"`, `"name"`, `"title"`, default: `"createdAt"`) - Sort field
- `sortOrder`: String (values: `"asc"`, `"desc"`, default: `"desc"`) - Sort direction

---

## Error Responses

### Common Error Formats

#### 400 Bad Request

```json
{
    "error": "Invalid data",
    "details": [
        {
            "path": ["properties"],
            "message": "Invalid enum value. Expected 'pricing' | 'product' | 'customer' | 'partnership' | 'branding' | 'messaging', received 'invalid_value'"
        }
    ]
}
```

#### 401 Unauthorized

```json
{
    "error": "Unauthorized"
}
```

#### 404 Not Found

```json
{
    "error": "Company not found"
}
```

#### 500 Internal Server Error

```json
{
    "error": "Internal Server Error",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "route": "/api/v1/companies",
    "message": "Something went wrong"
}
```

---

## Rate Limits and CORS

### CORS Configuration

- Allowed origins: `{{baseURL}}`, `https://subsignal.app`, `https://www.subsignal.app`
- Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Allowed headers: `Content-Type`, `Authorization`

### Session Management

- Session expires in 30 days
- Session updates every 24 hours
- Cookie prefix: `better-auth`

---

## Examples with Full Response

### Get Companies Example

```bash
curl -X GET "{{baseURL}}/api/v1/companies?page=1&pageSize=5" \
  -H "Accept: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}"
```

**Response:**

```json
{
    "data": [
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Example Company",
            "url": "https://example.com",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z",
            "pages": [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174001",
                    "title": "Homepage",
                    "url": "https://example.com",
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z"
                }
            ]
        }
    ],
    "pagination": {
        "page": 1,
        "pageSize": 5,
        "total": 1,
        "totalPages": 1
    }
}
```

### Create Page Example

```bash
curl -X POST "{{baseURL}}/api/v1/pages" \
  -H "Content-Type: application/json" \
  -H "Cookie: subsignal.session_token={{sessionToken}}" \
  -d '{
    "type": "existing",
    "title": "Products",
    "url": "https://example.com/products",
    "companyId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

**Response:**

```json
{
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "title": "Products",
    "url": "https://example.com/products",
    "companyId": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
