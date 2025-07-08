document.addEventListener("DOMContentLoaded", function () {

  // ✅ 1. Toggle sidebar on mobile
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('active');
    });
  }

  // ✅ 2. Toggle submenu (Orders, Products, etc.)
  document.querySelectorAll('.toggle-submenu').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.dataset.target;
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = (target.style.display === 'flex') ? 'none' : 'flex';
      }
    });
  });

  // ✅ 3. Close sidebar on outside click (for mobile only)
  document.addEventListener('click', function (e) {
    if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('active')) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    }
  });

  // ✅ 4. Toggle user dropdown
  const userToggle = document.getElementById('userDropdownToggle');
  const userDropdown = document.getElementById('userDropdown');
  if (userToggle && userDropdown) {
    userToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'flex' ? 'none' : 'flex';
    });

    // ✅ 5. Close user dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (userDropdown.style.display === 'flex' &&
          !userDropdown.contains(e.target) &&
          !userToggle.contains(e.target)) {
        userDropdown.style.display = 'none';
      }
    });
  }

  // ✅ 6. Simple animation for page content
  const animatedElements = document.querySelectorAll('.animated-content');
  animatedElements.forEach(el => {
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


