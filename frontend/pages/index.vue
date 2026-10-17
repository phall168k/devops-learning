<script setup lang="ts">
import {
  User,
  Plus,
  Search,
  EditPen,
  Delete,
  View,
  Refresh,
  CircleCheck,
} from "@element-plus/icons-vue";
interface UserRecord {
  id: number;
  username: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
const config = useRuntimeConfig();
const endpoint = `${config.public.baseUrl}/v1/admin/users`;
const users = ref<UserRecord[]>([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const error = ref("");
const formError = ref("");
const deleteError = ref("");
const notice = ref("");
const search = ref("");
const status = ref("all");
const page = ref(1);
const editorOpen = ref(false);
const editingId = ref<number | null>(null);
const details = ref<UserRecord | null>(null);
const deleteTarget = ref<UserRecord | null>(null);
const form = reactive({ username: "", password: "", isActive: true });
const activeCount = computed(
  () => users.value.filter((user) => user.isActive).length,
);
const filtered = computed(() =>
  users.value.filter(
    (user) =>
      user.username.toLowerCase().includes(search.value.trim().toLowerCase()) &&
      (status.value === "all" || user.isActive === (status.value === "active")),
  ),
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 8)));
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * 8, page.value * 8),
);
watch([search, status], () => {
  page.value = 1;
});
watch(pages, (count) => {
  page.value = Math.min(page.value, count);
});
function message(cause: unknown, fallback: string) {
  const value = (cause as { data?: { message?: string | string[] } })?.data
    ?.message;
  return Array.isArray(value) ? value.join(". ") : value || fallback;
}
function date(value: string) {
  return value && !Number.isNaN(new Date(value).getTime())
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "—";
}
async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    users.value = await $fetch<UserRecord[]>(endpoint);
  } catch (cause) {
    error.value = message(cause, "Unable to load users. Please try again.");
  } finally {
    loading.value = false;
  }
}
function edit(user?: UserRecord) {
  editingId.value = user?.id ?? null;
  Object.assign(form, {
    username: user?.username ?? "",
    password: "",
    isActive: user?.isActive ?? true,
  });
  formError.value = "";
  editorOpen.value = true;
}
async function save() {
  if (!form.username.trim()) {
    formError.value = "Please enter a username.";
    return;
  }
  saving.value = true;
  formError.value = "";
  notice.value = "";
  const updating = editingId.value !== null;
  const body: { username: string; isActive: boolean; password?: string } = {
    username: form.username.trim(),
    isActive: form.isActive,
  };
  if (form.password) body.password = form.password;
  try {
    await $fetch(updating ? `${endpoint}/${editingId.value}` : endpoint, {
      method: updating ? "PUT" : "POST",
      body,
    });
    editorOpen.value = false;
    notice.value = updating
      ? "User updated successfully."
      : "User created successfully.";
    await loadUsers();
  } catch (cause) {
    formError.value = message(
      cause,
      "Unable to save this user. Please try again.",
    );
  } finally {
    saving.value = false;
  }
}
function confirmDelete(user: UserRecord) {
  deleteError.value = "";
  deleteTarget.value = user;
}
async function remove() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  deleteError.value = "";
  notice.value = "";
  try {
    await $fetch(`${endpoint}/${deleteTarget.value.id}`, { method: "DELETE" });
    deleteTarget.value = null;
    notice.value = "User deleted successfully.";
    await loadUsers();
  } catch (cause) {
    deleteError.value = message(
      cause,
      "Unable to delete this user. Please try again.",
    );
  } finally {
    deleting.value = false;
  }
}
onMounted(loadUsers);
</script>

<template>
  <div class="workspace">
    <aside class="sidebar">
      <a class="brand" href="/"
        ><span class="brand-icon"
          ><el-icon><User /></el-icon></span
        >people<span class="brand-dot">.</span></a
      >
      <div class="nav-caption">WORKSPACE</div>
      <a class="nav-item" href="/" aria-current="page"
        ><el-icon><User /></el-icon>User management<span>{{
          users.length
        }}</span></a
      >
      <div class="admin">
        <span class="avatar">A</span>
        <div>
          <strong>Admin workspace</strong><small>User administration</small>
        </div>
        <i class="dot" />
      </div>
    </aside>
    <main>
      <header class="topbar">
        <div>
          Workspace <span class="separator">/</span
          ><strong>User management</strong>
        </div>
        <span class="console"><i class="dot" /> Admin console</span>
      </header>
      <div class="content">
        <div class="heading">
          <div>
            <div class="eyebrow">YOUR WORKSPACE, CONNECTED</div>
            <h1>User management</h1>
            <p>
              A little organization. A better-connected team. Manage all your
              users here.
            </p>
          </div>
          <button class="button primary" @click="edit()">
            <el-icon><Plus /></el-icon>Add user
          </button>
        </div>
        <section class="stats" aria-label="User statistics">
          <article>
            <div>
              <span>Total users</span
              ><strong>{{ loading ? "—" : users.length }}</strong
              ><small>Everyone in your workspace</small>
            </div>
            <span class="stat-icon"
              ><el-icon><User /></el-icon
            ></span>
          </article>
          <article>
            <div>
              <span>Active users</span
              ><strong>{{ loading ? "—" : activeCount }}</strong
              ><small><i class="dot" />Ready to connect</small>
            </div>
            <span class="stat-icon mint"
              ><el-icon><CircleCheck /></el-icon
            ></span>
          </article>
          <article>
            <div>
              <span>Inactive users</span
              ><strong>{{ loading ? "—" : users.length - activeCount }}</strong
              ><small><i class="dot gray" />Accounts on pause</small>
            </div>
            <span class="stat-icon neutral"
              ><el-icon><User /></el-icon
            ></span>
          </article>
        </section>
        <div v-if="notice" class="notice" role="status">
          {{ notice
          }}<button aria-label="Dismiss notification" @click="notice = ''">
            ×
          </button>
        </div>
        <section class="directory" aria-labelledby="directory-title">
          <div class="panel-heading">
            <div>
              <h2 id="directory-title">
                User directory <span>{{ users.length }}</span>
              </h2>
              <p>A home for everyone in your workspace.</p>
            </div>
            <button class="button" :disabled="loading" @click="loadUsers">
              <el-icon :class="{ spinning: loading }"><Refresh /></el-icon
              >Refresh
            </button>
          </div>
          <div class="toolbar">
            <label class="search"
              ><el-icon><Search /></el-icon
              ><input
                v-model="search"
                type="search"
                placeholder="Search by username..."
                aria-label="Search by username" /></label
            ><label class="filter"
              >Status<select
                v-model="status"
                aria-label="Filter users by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select></label
            >
          </div>
          <div v-if="error" class="empty" role="alert">
            <h3>We couldn’t load your users</h3>
            <p>{{ error }}</p>
            <button class="button" @click="loadUsers">Try again</button>
          </div>
          <div v-else-if="loading" class="empty" role="status">
            <el-icon class="spinning"><Refresh /></el-icon>
            <p>Loading your workspace...</p>
          </div>
          <template v-else>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Created on</th>
                    <th>Last updated</th>
                    <th class="actions-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(user, index) in visible" :key="user.id">
                    <td>
                      <div class="user-cell">
                        <span class="avatar" :class="`color-${index % 4}`">{{
                          user.username.slice(0, 2).toUpperCase()
                        }}</span>
                        <div>
                          <button class="username" @click="details = user">
                            {{ user.username }}</button
                          ><small>User ID: #{{ user.id }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        class="status"
                        :class="user.isActive ? 'active' : 'inactive'"
                        ><i class="dot" />{{
                          user.isActive ? "Active" : "Inactive"
                        }}</span
                      >
                    </td>
                    <td>{{ date(user.createdAt) }}</td>
                    <td>{{ date(user.updatedAt) }}</td>
                    <td>
                      <div class="actions">
                        <button
                          :aria-label="`View ${user.username}`"
                          title="View details"
                          @click="details = user"
                        >
                          <el-icon><View /></el-icon></button
                        ><button
                          :aria-label="`Edit ${user.username}`"
                          title="Edit user"
                          @click="edit(user)"
                        >
                          <el-icon><EditPen /></el-icon></button
                        ><button
                          class="delete"
                          :aria-label="`Delete ${user.username}`"
                          title="Delete user"
                          @click="confirmDelete(user)"
                        >
                          <el-icon><Delete /></el-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!filtered.length" class="empty">
              <span class="empty-icon"
                ><el-icon><User /></el-icon
              ></span>
              <h3>
                {{
                  users.length ? "No matching users" : "Your team starts here"
                }}
              </h3>
              <p>
                {{
                  users.length
                    ? "Try a different username or status filter."
                    : "Add your first user to bring your workspace to life."
                }}
              </p>
              <button
                v-if="users.length"
                class="button"
                @click="
                  search = '';
                  status = 'all';
                "
              >
                Clear filters</button
              ><button v-else class="button primary" @click="edit()">
                Add your first user
              </button>
            </div>
            <footer class="table-footer">
              <span
                >Showing
                <strong
                  >{{ filtered.length ? (page - 1) * 8 + 1 : 0 }}–{{
                    Math.min(page * 8, filtered.length)
                  }}</strong
                >
                of <strong>{{ filtered.length }}</strong> users</span
              >
              <div>
                <button class="button" :disabled="page <= 1" @click="page--">
                  Previous</button
                ><span>{{ page }} / {{ pages }}</span
                ><button
                  class="button"
                  :disabled="page >= pages"
                  @click="page++"
                >
                  Next
                </button>
              </div>
            </footer>
          </template>
        </section>
        <p class="footnote">A great workspace starts with great people.</p>
      </div>
    </main>
    <el-dialog
      v-model="editorOpen"
      :title="editingId !== null ? 'Edit user' : 'Add a new user'"
      width="460px"
      :close-on-click-modal="!saving"
      :close-on-press-escape="!saving"
      :show-close="!saving"
    >
      <p class="intro">
        {{
          editingId !== null
            ? "Keep this account’s details up to date."
            : "Give someone a place in your workspace."
        }}
      </p>
      <form @submit.prevent="save">
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <label class="field"
          >Username<input
            v-model="form.username"
            required
            maxlength="150"
            autocomplete="off"
            placeholder="e.g. alex.morgan"
            :disabled="saving" /></label
        ><label class="field"
          >Password
          <span v-if="editingId !== null" class="optional">optional</span
          ><input
            v-model="form.password"
            type="password"
            :required="editingId === null"
            autocomplete="new-password"
            :placeholder="
              editingId !== null
                ? 'Leave blank to keep current password'
                : 'Enter a password'
            "
            :disabled="saving" /></label
        ><label class="checkbox"
          ><input
            v-model="form.isActive"
            type="checkbox"
            :disabled="saving"
          /><span
            ><strong>Active account</strong
            ><small>Mark this user as active in the workspace.</small></span
          ></label
        >
        <div class="dialog-actions">
          <button
            class="button"
            type="button"
            :disabled="saving"
            @click="editorOpen = false"
          >
            Cancel</button
          ><button class="button primary" type="submit" :disabled="saving">
            {{
              saving
                ? "Saving..."
                : editingId !== null
                  ? "Save changes"
                  : "Create user"
            }}
          </button>
        </div>
      </form>
    </el-dialog>
    <el-dialog
      :model-value="!!details"
      title="User details"
      width="460px"
      @update:model-value="details = null"
      ><template v-if="details"
        ><h3 class="detail-name">{{ details.username }}</h3>
        <dl>
          <div>
            <dt>User ID</dt>
            <dd>#{{ details.id }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ details.isActive ? "Active" : "Inactive" }}</dd>
          </div>
          <div>
            <dt>Created on</dt>
            <dd>{{ date(details.createdAt) }}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{{ date(details.updatedAt) }}</dd>
          </div>
        </dl>
        <div class="dialog-actions">
          <button
            class="button primary"
            @click="
              edit(details);
              details = null;
            "
          >
            Edit user
          </button>
        </div></template
      ></el-dialog
    >
    <el-dialog
      :model-value="!!deleteTarget"
      title="Delete this user?"
      width="440px"
      :close-on-click-modal="!deleting"
      :close-on-press-escape="!deleting"
      :show-close="!deleting"
      @update:model-value="deleteTarget = null"
      ><p class="intro">
        Remove <strong>{{ deleteTarget?.username }}</strong> from your
        workspace? This user will no longer appear in the directory.
      </p>
      <p v-if="deleteError" class="form-error" role="alert">
        {{ deleteError }}
      </p>
      <div class="dialog-actions">
        <button
          class="button"
          :disabled="deleting"
          @click="deleteTarget = null"
        >
          Cancel</button
        ><button class="button danger" :disabled="deleting" @click="remove">
          {{ deleting ? "Deleting..." : "Delete user" }}
        </button>
      </div></el-dialog
    >
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #f7f8fb;
}
.workspace {
  --accent: #6b4de6;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #282c3b;
  min-height: 100vh;
  font-size: 14px;
}
* {
  box-sizing: border-box;
}
button,
input,
select {
  font: inherit;
}
button {
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button,
input,
select,
a {
  outline-offset: 4px;
}
:focus-visible {
  outline: 2px solid var(--accent);
}
.el-icon {
  font-size: 17px;
  flex-shrink: 0;
}
.sidebar {
  width: 236px;
  position: fixed;
  inset: 0 auto 0 0;
  background: white;
  border-right: 1px solid #e9ebf2;
  padding: 35px 18px;
  display: flex;
  flex-direction: column;
}
.brand {
  display: flex;
  align-items: center;
  padding: 0 13px;
  color: #252837;
  text-decoration: none;
  font-size: 30px;
  font-weight: 750;
  letter-spacing: -1.5px;
  gap: 10px;
}
.brand-icon {
  display: grid;
  place-items: center;
  background: var(--accent);
  width: 34px;
  height: 36px;
  color: white;
  border-radius: 11px;
}
.brand-dot {
  color: var(--accent);
  margin-left: -10px;
}
.nav-caption {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.7px;
  color: #989caa;
  margin: 53px 15px 16px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 12px;
  text-decoration: none;
  border-radius: 8px;
  background: #f0ecff;
  color: #6749d6;
  font-size: 12px;
  font-weight: 600;
}
.nav-item > span {
  margin-left: auto;
  background: #e4dcff;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 11px;
}
.admin {
  margin-top: auto;
  padding: 20px 4px 0;
  border-top: 1px solid #eeeef4;
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin strong {
  font-size: 11px;
}
.admin small {
  display: block;
  color: #8c90a0;
  font-size: 10px;
  margin-top: 5px;
}
.admin > .dot {
  margin-left: auto;
}
.dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  background: #38ad80;
  border-radius: 50%;
  flex-shrink: 0;
}
.gray {
  background: #a8adba;
}
main {
  margin-left: 236px;
}
.topbar {
  min-height: 77px;
  border-bottom: 1px solid #e9ebf2;
  background: white;
  padding: 0 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9297a6;
  font-size: 12px;
}
.topbar strong {
  color: #555b6c;
  font-weight: 500;
}
.separator {
  margin: 0 18px;
  color: #c3c6d0;
}
.console {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e9ebf2;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 11px;
  color: #697082;
}
.content {
  padding: 43px 42px 24px;
  max-width: 1500px;
  margin: auto;
}
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 1.7px;
  font-weight: 650;
  color: #8b80b2;
  margin-bottom: 10px;
}
h1 {
  font-size: 29px;
  letter-spacing: -0.9px;
  font-weight: 700;
  margin: 0 0 10px;
}
.heading p {
  color: #858998;
  font-size: 12px;
  margin: 0;
  line-height: 1.7;
}
.button {
  border: 1px solid #e2e4ed;
  background: #fff;
  color: #555a6d;
  border-radius: 7px;
  padding: 9px 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 550;
  white-space: nowrap;
  min-height: 36px;
  transition: background 0.15s;
}
.button:hover:not(:disabled) {
  background: #f3f1fc;
}
.button.primary {
  color: white;
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: 0 3px 5px #6b4de619;
}
.button.primary:hover:not(:disabled) {
  background: #583bc9;
}
.button.danger {
  color: white;
  background: #dc4557;
  border-color: #dc4557;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 28px;
}
.stats article {
  background: #fff;
  border: 1px solid #e8eaf1;
  border-radius: 10px;
  padding: 23px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.stats article span {
  font-size: 12px;
  color: #787e8e;
}
.stats strong {
  display: block;
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -1px;
  margin: 12px 0 10px;
}
.stats small {
  color: #969aa7;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.stats .stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #f0ecff;
  color: #8769e5;
}
.stats .mint {
  background: #e8f7f0;
  color: #4caa85;
}
.stats .neutral {
  background: #f1f3f7;
  color: #949bab;
}
.directory {
  background: white;
  border: 1px solid #e5e7f0;
  border-radius: 11px;
  overflow: hidden;
  box-shadow: 0 3px 7px #25283703;
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  gap: 12px;
}
h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 650;
  display: flex;
  gap: 10px;
  align-items: center;
}
h2 span {
  background: #f1edff;
  color: #8062d8;
  border-radius: 5px;
  font-size: 10px;
  padding: 3px 7px;
}
.panel-heading p {
  font-size: 11px;
  color: #979ba7;
  margin: 8px 0 0;
}
.panel-heading .button {
  font-size: 11px;
}
.panel-heading .el-icon {
  font-size: 14px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px 22px;
}
.search {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #e4e6ee;
  padding: 10px 12px;
  border-radius: 7px;
  width: 310px;
  color: #9da2b0;
}
.search input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 12px;
  color: #44495c;
}
.search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px #6b4de612;
}
.search input::placeholder {
  color: #999fae;
}
.filter {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #868b9b;
}
.filter select {
  padding: 9px 25px 9px 10px;
  color: #62687a;
  border: 1px solid #e4e6ee;
  border-radius: 6px;
  background: white;
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
}
th {
  background: #fafbfe;
  color: #9197a7;
  font-size: 11px;
  font-weight: 550;
  padding: 13px 24px;
  border-block: 1px solid #eceef5;
}
td {
  padding: 17px 24px;
  border-bottom: 1px solid #f0f1f6;
  color: #858a99;
  font-size: 12px;
}
tbody tr:hover {
  background: #fcfbff;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 36px;
  width: 36px;
  border-radius: 11px;
  background: #eee9fc;
  color: #8667ce;
  font-size: 11px;
  font-weight: 650;
}
.color-1 {
  background: #e5f2f6;
  color: #5e9db3;
}
.color-2 {
  background: #fff0e3;
  color: #c08f5e;
}
.color-3 {
  background: #e8f3ed;
  color: #67a183;
}
.username {
  background: none;
  padding: 0;
  border: 0;
  color: #454959;
  font-weight: 600;
  font-size: 12px;
  text-align: left;
}
.username:hover {
  color: var(--accent);
}
.user-cell small {
  display: block;
  margin-top: 5px;
  font-size: 10px;
  color: #a1a5b2;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 5px 8px;
  border-radius: 5px;
}
.active {
  color: #439c78;
  background: #ecf8f1;
}
.inactive {
  color: #8e94a3;
  background: #f0f2f6;
}
.inactive .dot {
  background: #a2a8b6;
}
.actions-heading {
  text-align: right;
}
.actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.actions button {
  border: 0;
  background: none;
  color: #9299ac;
  border-radius: 5px;
  padding: 6px;
  display: flex;
}
.actions .el-icon {
  font-size: 16px;
}
.actions button:hover {
  background: #eee9fc;
  color: var(--accent);
}
.actions .delete:hover {
  color: #d54c5b;
  background: #fff0f1;
}
.table-footer {
  padding: 17px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  color: #999eac;
  font-size: 11px;
}
.table-footer strong {
  color: #666c7c;
  font-weight: 550;
}
.table-footer > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.table-footer .button {
  font-size: 11px;
  padding: 6px 11px;
  min-height: 30px;
}
.footnote {
  text-align: center;
  font-size: 11px;
  color: #a1a6b3;
  margin-top: 26px;
}
.empty {
  text-align: center;
  padding: 55px 20px;
  color: #8a90a0;
}
.empty h3 {
  color: #555b6e;
  font-size: 16px;
}
.empty p {
  font-size: 12px;
  margin: 12px 0 20px;
}
.empty-icon {
  display: inline-grid;
  place-items: center;
  background: #f2edff;
  border-radius: 14px;
  width: 50px;
  height: 50px;
  color: var(--accent);
}
.notice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #eaf7f0;
  color: #358361;
  border-radius: 7px;
  margin-bottom: 16px;
  font-size: 12px;
}
.notice button {
  background: none;
  border: 0;
  font-size: 20px;
  color: inherit;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.intro {
  color: #858998;
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 24px;
}
.field {
  display: block;
  font-size: 12px;
  color: #555b6c;
  font-weight: 550;
  margin: 20px 0;
}
.field input {
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid #e1e3ec;
  border-radius: 7px;
  font-size: 13px;
}
.optional {
  color: #a0a5b0;
  font-weight: 400;
  margin-left: 5px;
}
.checkbox {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 12px;
  margin: 24px 0;
}
.checkbox input {
  accent-color: var(--accent);
  margin-top: 2px;
}
.checkbox strong {
  font-weight: 550;
}
.checkbox small {
  display: block;
  color: #9096a4;
  margin-top: 6px;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eceef4;
  padding-top: 20px;
  margin-top: 24px;
}
.form-error {
  background: #fff0f1;
  color: #c34755;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
}
.detail-name {
  overflow-wrap: anywhere;
}
dl > div {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f1f6;
  font-size: 13px;
}
dt {
  color: #969ba8;
}
dd {
  margin: 0;
  color: #555b6c;
}
@media (max-width: 1150px) {
  .sidebar {
    width: 205px;
    padding-inline: 12px;
  }
  main {
    margin-left: 205px;
  }
  .content {
    padding: 30px 24px;
  }
  .topbar {
    padding-inline: 24px;
  }
  td,
  th {
    padding-inline: 16px;
  }
  .stats article {
    padding: 18px;
  }
  .heading p {
    max-width: 350px;
  }
}
@media (max-width: 850px) {
  .sidebar {
    position: static;
    width: 100%;
    padding: 15px 24px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e9ebf2;
  }
  .brand {
    font-size: 24px;
    padding: 0;
  }
  .nav-caption,
  .admin {
    display: none;
  }
  .nav-item {
    font-size: 11px;
  }
  main {
    margin-left: 0;
  }
  .topbar {
    min-height: 56px;
  }
  .stats {
    gap: 12px;
  }
  .stats article {
    padding: 16px;
  }
  .stats small {
    font-size: 9px;
  }
}
@media (max-width: 560px) {
  .content {
    padding: 27px 16px;
  }
  .topbar {
    padding-inline: 16px;
  }
  .console {
    display: none;
  }
  .heading {
    align-items: flex-start;
    gap: 12px;
  }
  h1 {
    font-size: 24px;
  }
  .eyebrow {
    font-size: 8px;
  }
  .heading p {
    font-size: 11px;
  }
  .heading .button {
    padding: 9px 11px;
    font-size: 11px;
  }
  .stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .stats article {
    padding: 15px 18px;
  }
  .stats article > div {
    display: grid;
    grid-template-columns: 85px 40px 1fr;
    align-items: center;
    gap: 10px;
    flex: 1;
  }
  .stats strong {
    margin: 0;
    font-size: 24px;
  }
  .stats article span {
    font-size: 11px;
  }
  .panel-heading {
    padding: 20px 16px;
  }
  .toolbar {
    padding-inline: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .search {
    width: 100%;
  }
  .filter {
    margin-left: auto;
  }
  .table-footer {
    padding: 16px;
    flex-wrap: wrap;
  }
  .table-footer > div {
    margin-left: auto;
  }
  .nav-item {
    padding: 10px;
  }
  .nav-item > span {
    display: none;
  }
}
:global(.el-dialog) {
  max-width: calc(100vw - 32px);
  border-radius: 12px;
  padding: 25px;
}
:global(.el-dialog__title) {
  font-weight: 650;
  color: #303548;
}
@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
