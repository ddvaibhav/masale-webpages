 // Toggle sidebar on mobile
        document.getElementById('sidebarToggle').addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
        
        // Simple animation for page elements
        document.addEventListener('DOMContentLoaded', function() {
            const animatedElements = document.querySelectorAll('.animated-content');
            
            animatedElements.forEach((el, index) => {
                el.style.opacity = '0';
            });
            
            setTimeout(() => {
                animatedElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.style.opacity = '1';
                    }, index * 100);
                });
            }, 300);
        });
        // Close sidebar on outside click (mobile only)
            document.addEventListener('click', function (e) {
            const sidebar = document.querySelector('.sidebar');
            const toggle = document.getElementById('sidebarToggle');
    
    // If clicked outside sidebar and toggle button, hide sidebar
    if (window.innerWidth <= 992 && sidebar.classList.contains('active') &&
        !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('active');
    }
    });
    // Toggle user dropdown
        document.getElementById('userDropdownToggle').addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('userDropdown');
            dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            const dropdown = document.getElementById('userDropdown');
            const toggleBtn = document.getElementById('userDropdownToggle');

            if (dropdown && dropdown.style.display === 'flex' &&
                !dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
                dropdown.style.display = 'none';
                }
            });

        // Toggle sidebar dropdown for Orders
        document.getElementById('ordersToggle').addEventListener('click', function (e) {
            e.preventDefault();
            const submenu = document.getElementById('ordersMenu');
            submenu.style.display = submenu.style.display === 'flex' ? 'none' : 'flex';
        });


        