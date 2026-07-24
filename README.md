# Question and Answer REST API

REST API สำหรับระบบคำถามและคำตอบ พัฒนาด้วย Express.js และ PostgreSQL

## Features

- สร้าง ดู แก้ไข และลบคำถาม
- ค้นหาคำถามจากหัวข้อหรือหมวดหมู่
- สร้างและดูคำตอบของแต่ละคำถาม
- ลบคำตอบทั้งหมดของคำถาม
- โหวตคำถามและคำตอบด้วยค่า `1` หรือ `-1`
- จำกัดคำตอบไม่เกิน 300 ตัวอักษร
- ลบคำตอบและคะแนนโหวตที่เกี่ยวข้องโดยอัตโนมัติเมื่อลบคำถาม

## Technologies

- Node.js
- Express.js
- PostgreSQL
- node-postgres (`pg`)
- dotenv
- Nodemon

## Project Structure

```text
.
├── app.mjs
├── middlewares/
│   └── validation.mjs
├── routes/
│   ├── answerRoutes.mjs
│   └── questionRoutes.mjs
├── utils/
│   └── db.mjs
├── .env.example
├── package.json
└── README.md
```

## Getting Started

### 1. Prerequisites

ตรวจสอบว่าเครื่องติดตั้งโปรแกรมต่อไปนี้แล้ว:

- Node.js
- npm
- PostgreSQL

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

คัดลอก `.env.example` เป็น `.env` แล้วกำหนด PostgreSQL connection string:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

ไฟล์ `.env` ถูกเพิ่มไว้ใน `.gitignore` แล้ว จึงไม่ควร commit รหัสผ่านฐานข้อมูลลง Git

### 4. Start the Server

```bash
npm start
```

เซิร์ฟเวอร์จะทำงานที่:

```text
http://localhost:4000
```

ทดสอบสถานะเซิร์ฟเวอร์:

```http
GET /test
```

## API Endpoints

### Questions

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/questions` | สร้างคำถาม |
| `GET` | `/questions` | ดูคำถามทั้งหมด |
| `GET` | `/questions/search` | ค้นหาคำถามจากหัวข้อหรือหมวดหมู่ |
| `GET` | `/questions/:questionId` | ดูคำถามตาม ID |
| `PUT` | `/questions/:questionId` | แก้ไขคำถาม |
| `DELETE` | `/questions/:questionId` | ลบคำถาม |
| `POST` | `/questions/:questionId/vote` | โหวตคำถาม |

### Answers

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/questions/:questionId/answers` | สร้างคำตอบให้คำถาม |
| `GET` | `/questions/:questionId/answers` | ดูคำตอบทั้งหมดของคำถาม |
| `DELETE` | `/questions/:questionId/answers` | ลบคำตอบทั้งหมดของคำถาม |
| `POST` | `/answers/:answerId/vote` | โหวตคำตอบ |

## Request Examples

### Create a Question

```http
POST /questions
Content-Type: application/json
```

```json
{
  "title": "What is Express.js?",
  "description": "I would like to learn more about Express.js.",
  "category": "Software"
}
```

ต้องส่ง `title`, `description` และ `category` เป็นข้อความที่ไม่เป็นค่าว่าง

### Get All Questions

```http
GET /questions
```

ตัวอย่าง response:

```json
{
  "data": [
    {
      "id": 1,
      "title": "What is Express.js?",
      "description": "I would like to learn more about Express.js.",
      "category": "Software"
    }
  ]
}
```

### Get a Question by ID

```http
GET /questions/1
```

### Update a Question

```http
PUT /questions/1
Content-Type: application/json
```

```json
{
  "title": "What is Express.js middleware?",
  "description": "How does middleware work in Express.js?",
  "category": "Software"
}
```

ต้องส่ง `title`, `description` และ `category` ให้ครบทุกครั้ง

### Delete a Question

```http
DELETE /questions/1
```

เมื่อลบคำถาม คำตอบและคะแนนโหวตที่เกี่ยวข้องจะถูกลบตามผ่าน `ON DELETE CASCADE`

### Search Questions

ค้นหาจากหัวข้อ:

```http
GET /questions/search?title=express
```

ค้นหาจากหมวดหมู่:

```http
GET /questions/search?category=Software
```

ค้นหาจากหัวข้อหรือหมวดหมู่พร้อมกัน:

```http
GET /questions/search?title=express&category=Software
```

การค้นหาไม่สนใจตัวพิมพ์เล็กและตัวพิมพ์ใหญ่

### Create an Answer

```http
POST /questions/1/answers
Content-Type: application/json
```

```json
{
  "content": "Express.js is a web framework for Node.js."
}
```

`content` ต้องไม่เป็นค่าว่างและมีความยาวไม่เกิน 300 ตัวอักษร

### Get Answers for a Question

```http
GET /questions/1/answers
```

ตัวอย่าง response:

```json
{
  "data": [
    {
      "id": 1,
      "content": "Express.js is a web framework for Node.js."
    }
  ]
}
```

`id` ในรายการคือ Answer ID ส่วน `1` ใน URL คือ Question ID

### Delete All Answers for a Question

```http
DELETE /questions/1/answers
```

คำสั่งนี้จะลบคำตอบทั้งหมดของ Question ID ที่ระบุ แต่จะไม่ลบตัวคำถาม

### Vote on a Question

```http
POST /questions/1/vote
Content-Type: application/json
```

โหวตบวก:

```json
{
  "vote": 1
}
```

โหวตลบ:

```json
{
  "vote": -1
}
```

### Vote on an Answer

```http
POST /answers/1/vote
Content-Type: application/json
```

```json
{
  "vote": 1
}
```

ค่า `vote` ต้องเป็นตัวเลข `1` หรือ `-1` เท่านั้น

## HTTP Status Codes

| Status | Meaning |
| --- | --- |
| `200 OK` | ดำเนินการสำเร็จ |
| `201 Created` | สร้างข้อมูลสำเร็จ |
| `400 Bad Request` | ข้อมูลหรือ parameter ไม่ถูกต้อง |
| `404 Not Found` | ไม่พบ Question หรือ Answer |
| `500 Internal Server Error` | เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ |

## Database Relationships

- Question หนึ่งรายการมี Answers ได้หลายรายการ
- Question หนึ่งรายการมี Question Votes ได้หลายรายการ
- Answer หนึ่งรายการมี Answer Votes ได้หลายรายการ
- `answers.question_id` อ้างอิง `questions.id`
- `question_votes.question_id` อ้างอิง `questions.id`
- `answer_votes.answer_id` อ้างอิง `answers.id`
- Foreign keys ใช้ `ON DELETE CASCADE`

## Notes

- API ใช้ parameterized queries เพื่อช่วยป้องกัน SQL injection
- Validation แยกไว้ใน `middlewares/validation.mjs`
- Routes แยกไว้ในโฟลเดอร์ `routes`
- ไม่ควร commit ไฟล์ `.env` หรือข้อมูลลับลง Git
