// Toggle para preguntas frecuentes
function toggleFaq(element) {
    const question = element;
    const answer = question.nextElementSibling;
    const icon = question.querySelector('.icon');
    
    answer.classList.toggle('show');
    question.classList.toggle('active');
    
    if (icon) {
        icon.style.transform = answer.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// Búsqueda en la guía
function setupSearch() {
    const searchInput = document.getElementById('searchGuide');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const sections = document.querySelectorAll('.guide-section');
        
        if (searchTerm === '') {
            sections.forEach(section => {
                section.style.display = 'block';
            });
            return;
        }
        
        sections.forEach(section => {
            const text = section.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    });
}

// Navegación suave a anclas
function setupSmoothScroll() {
    document.querySelectorAll('.quick-nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Guide.js inicializado');
    setupSearch();
    setupSmoothScroll();
    
    // Abrir primer FAQ por defecto (opcional)
    const firstFaq = document.querySelector('.faq-question');
    if (firstFaq) {
        // No abrir automáticamente, pero mantener funcionalidad
    }
});