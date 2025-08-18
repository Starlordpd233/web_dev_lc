# Study Hub (Static Site)

**What this is:** a lightweight static site for listing courses and free study resources. Works on Netlify via drag‑and‑drop.

## How to use
1. Edit `data/courses.json` to add courses/resources. Keep `id` unique.
2. Open `index.html` locally or deploy.
3. Deploy to Netlify: log in → **Sites** → **Add new site** → **Deploy manually** → drag the whole folder.

### Data shape
```json
{
  "version": 1,
  "updated": "YYYY-MM-DD",
  "school": "Loomis Chaffee",
  "courses": [
    {
      "id": "unique-id",
      "title": "Course Name",
      "department": "Dept",
      "level": "Grade or Level",
      "tags": ["tag1","tag2"],
      "description": "Optional",
      "syllabus": "https://link.to/syllabus",
      "resources": [
        { "type": "video|pdf|exercise|link", "title": "Title", "url": "https://...", "provider": "Optional", "description": "Optional" }
      ]
    }
  ]
}
```

### Notes
- Links included here are placeholders or public resources; replace as needed.
- `course.html?id=the-course-id` renders a single course page.
