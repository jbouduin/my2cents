### Embedding in your HTML
Embed in your HTML page:

```html
<div class="comments-go-here"></div>
<script src="https://site.example.com/my2cents/embed.js"
    data-my2cents-slug="post-slug"
    data-my2cents-target=".comments-go-here">
</script>
```

**or** initialize *My2Cents* programmatically:

```html
<div class="comments-go-here"></div>

<script src="http://site.example.com/my2cents/client.js"></script>
<script>
    new My2Cents({
        target: '.comments-go-here',
        slug: 'post-slug',
        host: 'http://site.example.com'
    });
</script>
```
