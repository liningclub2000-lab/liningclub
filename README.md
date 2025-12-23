```markdown
# Landing page — conversion-focused

Энэхүү branch нь conversion-oriented single-page landing байна.

Файлууд:
- landing.html
- styles.css
- main.js

Тэдгээрийг локал шалгах:
1. git checkout -b add-landing-conversion
2. Хадгалах файлуудыг repo root-д байршуулна (эсвэл өөр folder тохируулна).
3. Локал тест:
   - python -m http.server 8000
   - хөтчинд http://localhost:8000/landing.html руу орж шалгана.

Form:
- Formspree ID-г `landing.html` дахь form action-д сольно: `https://formspree.io/f/your-id`

Deploy:
- Netlify эсвэл GitHub Pages дээр байрлуулахад тохиромжтой.

PR:
- Title: "Add conversion-focused landing page"
- Description: Бага хэмжээний landing page, hero, pricing, lead form (Formspree-т холбогдож болно). Өөрийн Formspree ID, logo болон зургуудаа оруулах шаардлагатай.
```
