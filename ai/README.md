# Coordifit AI API

This project is organized as a scalable FastAPI application that separates configuration,
database, CRUD logic, schemas, and API routing into dedicated modules. The layout makes it
easy to grow with additional endpoints and services.

## Project Structure

```
app/
├── api/
│   ├── api_v1/
│   │   └── api.py
│   ├── deps.py
│   └── v1/
│       └── endpoints/
│           └── background.py
├── core/
│   ├── config.py
│   └── security.py
├── crud/
│   └── crud_user.py
├── db/
│   ├── base.py
│   ├── base_class.py
│   ├── init_db.py
│   └── session.py
├── models/
│   └── user.py
├── schemas/
│   ├── background.py
│   └── user.py
├── utils/
│   └── background.py
└── main.py
```

The root `main.py` simply exposes the FastAPI instance for deployment convenience.

## Background Removal API

### Endpoint

- **URL**: `/api/v1/background/remove-bg`
- **Method**: `POST`
- **Description**: Removes the background from an uploaded image and returns a Base64-encoded
  PNG with transparency.

### Request

- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `file` (required) – the image file to process. Only image MIME types are accepted.

### Successful Response

```json
{
  "status": "success",
  "result_image": "<base64-encoded-png>"
}
```

### Error Responses

- `400 Bad Request`: Returned when the uploaded file is not an image.
- `500 Internal Server Error`: Returned when background removal fails for an unexpected reason.

### Example `curl`

```bash
curl -X POST "http://localhost:8000/api/v1/background/remove-bg" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@example.png"
```

The response `result_image` field contains the Base64 string of the processed PNG. You can
persist this value directly or decode it to save as a file.

## Running the Application

```bash
uvicorn app.main:app --reload
```

This command starts the FastAPI development server with auto-reload enabled. Once running,
you can explore the interactive documentation at `http://localhost:8000/docs`.
