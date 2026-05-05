kon# Masala Webpage Enhancement Plan - Make it "MAST" 🚀

## Progress Tracker (Updated after each step)

### ✅ Phase 0: Planning Complete
- [x] User approved comprehensive plan

### ✅ Phase 1: Setup & Dependencies
1. [x] Update package.json: Add security/prod deps (dotenv, helmet, mysql2, express-rate-limit, express-validator, cors, compression)
2. [x] `npm install` new deps
3. [x] Create .env.example & update .gitignore
4. [x] Git: Create `blackboxai/enhancements` branch

### ✅ Phase 2: Backend Security & Refactor (Partial)
5. [x] Refactor index.js: Add middleware (helmet, rate-limit, cors, compression), dotenv config
6. [x] Update conn.js: Use mysql2 connection pool, async/await properly

**Current Step: 9/18 - Frontend integration (home.ejs)**
### ✅ Phase 1: Setup & Dependencies
1. [x] Update package.json: Add security/prod deps (dotenv, helmet, mysql2, express-rate-limit, express-validator, cors, compression)
2. [x] `npm install` new deps
3. [x] Create .env.example & update .gitignore
4. [x] Git: Create `blackboxai/enhancements` branch

**Current Step: 5/18 - Refactoring index.js**

### 🔄 Phase 2: Backend Security & Refactor
5. [ ] Refactor index.js: Add middleware (helmet, rate-limit, cors, compression), dotenv config
6. [ ] Update conn.js: Use mysql2 connection pool, async/await properly
7. [ ] Sample route fixes: Parametrized queries & validation in routes/admin.js, routes/user.js
8. [ ] Test server: `node index.js` - check no errors, / and /admin/login work

### 🔄 Phase 3: Frontend Integration
9. [ ] Convert static index.html → views/user/home.ejs, update navbar links to dynamic
10. [ ] Update views/user/navbar.ejs & footer.ejs for consistency
11. [ ] Add search/filter JS in public/

### 🔄 Phase 4: Production & GitHub Polish
12. [ ] Comprehensive README.md (setup, screenshots, API docs)
13. [ ] Create .github/workflows/ci.yml for lint/test
14. [ ] Image optimization (compress public/images/)
15. [ ] PM2 ecosystem.config.js & Dockerfile

### 🔄 Phase 5: Deploy & PR
16. [ ] Test full flow: register, add product/order as admin/user
17. [ ] Commit all, push to branch
18. [ ] Create GitHub PR

**Current Step: 1/18 - Updating package.json**

**Next Action:** Approve next step or changes?

