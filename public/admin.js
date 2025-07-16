  
    // Toggle sidebar
    document.getElementById('sidebarToggle').addEventListener('click', function() {
      document.getElementById('sidebar').classList.toggle('sidebar-collapsed');
      document.getElementById('main-content').classList.toggle('top-collapsed');
      
      // For mobile view
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.toggle('sidebar-show');
      }
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
      const sidebar = document.getElementById('sidebar');
      const sidebarToggle = document.getElementById('sidebarToggle');
      
      if (window.innerWidth <= 768 && 
          !sidebar.contains(event.target) && 
          !sidebarToggle.contains(event.target) && 
          sidebar.classList.contains('sidebar-show')) {
        sidebar.classList.remove('sidebar-show');
      }
    });
    
    // Toggle submenus with animations
    document.querySelectorAll('.toggle-submenu').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetSelector = this.getAttribute('data-target');
        const submenu = document.querySelector(targetSelector);
        const chevron = this.querySelector('.chevron-animate');
        
        if (submenu) {
          // Toggle the 'show' class for the submenu
          submenu.classList.toggle('show');
          
          // Toggle the chevron rotation
          chevron.classList.toggle('chevron-rotate');
        }
      });
    });
    
    // Set active button for chart time period
    document.querySelectorAll('.btn-outline-secondary').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.btn-outline-secondary').forEach(b => {
          b.classList.remove('active');
        });
        this.classList.add('active');
      });
    });
    
    // Animate progress bars on page load
    document.addEventListener('DOMContentLoaded', function() {
      const progressBars = document.querySelectorAll('.progress-bar-animate');
      progressBars.forEach(bar => {
        // Reset width to 0 for animation
        const width = bar.style.width;
        bar.style.width = '0';
        
        // Trigger reflow
        void bar.offsetWidth;
        
        // Animate to the actual width
        bar.style.width = width;
      });
      
      // Handle scroll indicator in sidebar
      const scrollContainer = document.querySelector('.sidebar-scroll-container');
      const scrollIndicator = document.querySelector('.scroll-indicator');
      
      if (scrollContainer && scrollIndicator) {
        // Check if scrolling is possible
        scrollContainer.addEventListener('scroll', function() {
          // Calculate if we're at the bottom
          const atBottom = this.scrollHeight - this.scrollTop === this.clientHeight;
          
          if (atBottom) {
            scrollIndicator.classList.add('hidden');
          } else {
            scrollIndicator.classList.remove('hidden');
          }
        });
        
        // Initial check
        if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
          scrollIndicator.classList.add('hidden');
        }
      }
    });
  
  
  
  function fetchOrderNotifications() {
    fetch('/admin/notification-count')
      .then(res => res.json())
      .then(data => {
        const badge = document.getElementById("order-badge");
        if (data.unseenCount > 0) {
          badge.textContent = data.unseenCount;
          badge.classList.remove("d-none");
        } else {
          badge.classList.add("d-none");
        }
      });
  }

  // Call immediately once
  fetchOrderNotifications();

  // Then poll every 10 seconds
  setInterval(fetchOrderNotifications, 10000); // 10000 ms = 10 seconds
