<template>
  <div class="h-full w-full min-w-0 min-h-0 flex flex-col gap-4 overflow-hidden">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
      <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-20">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.totalUsers }}</p>
          <h3 class="text-xl font-bold text-gray-800">{{ totalUsers }}</h3>
        </div>
        <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>
    </div>

    <div class="glass-panel rounded-2xl shadow-sm overflow-hidden border-0 ring-1 ring-gray-900/5 flex flex-col flex-1 min-h-0">
      <div class="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row justify-between items-center shrink-0 gap-4 lg:gap-0">
        <div class="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form @submit.prevent="handleUserSearch" class="relative w-full lg:w-auto">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              :value="userSearchQuery"
              @input="setUserSearchQuery($event.target.value)"
              @keyup.enter="handleUserSearch"
              type="search"
              enterkeyhint="search"
              :placeholder="t.searchUserPlaceholder"
              class="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full lg:w-64 transition-all"
            >
            <button
              v-if="userSearchQuery"
              type="button"
              @click="clearUserSearch"
              class="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </button>
          </form>
          <select
            :value="userStatusFilter"
            @change="setUserStatusFilter($event.target.value); handleUserStatusFilter()"
            class="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 py-2 px-3 w-full sm:w-auto"
          >
            <option value="">{{ t.userStatusAll }}</option>
            <option value="pending">{{ t.userStatus.pending }}</option>
            <option value="active">{{ t.userStatus.active }}</option>
            <option value="banned">{{ t.userStatus.banned }}</option>
          </select>
        </div>

        <div class="flex items-center space-x-2 text-sm text-gray-600 w-full lg:w-auto justify-between lg:justify-end">
          <select
            :value="usersPerPage"
            @change="setUsersPerPage($event.target.value); changeUsersPerPage()"
            class="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 px-2"
          >
            <option :value="10">10 / {{ t.itemsPerPage }}</option>
            <option :value="20">20 / {{ t.itemsPerPage }}</option>
            <option :value="30">30 / {{ t.itemsPerPage }}</option>
            <option :value="50">50 / {{ t.itemsPerPage }}</option>
            <option :value="100">100 / {{ t.itemsPerPage }}</option>
          </select>
          <div class="flex items-center space-x-1 ml-2">
            <button
              @click="changeUserPage(currentUserPage - 1)"
              :disabled="currentUserPage === 1"
              class="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              :title="t.previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="px-2 font-medium">{{ t.pageInfo.replace('{page}', currentUserPage).replace('{total}', totalUserPages) }}</span>
            <button
              @click="changeUserPage(currentUserPage + 1)"
              :disabled="currentUserPage === totalUserPages"
              class="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              :title="t.next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-auto relative flex-1 min-h-0">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50/95 sticky top-0 z-20 backdrop-blur-sm shadow-sm">
            <tr>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 z-30 bg-gray-50 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)]">ID</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.username }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.reason }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.userRole.user }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.statusLabel }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.points }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.registerTitle }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.actions }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white/60">
            <tr v-for="u in users" :key="u.id" class="hover:bg-blue-50/50 transition-colors group">
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-500 font-mono sticky left-0 z-10 bg-white group-hover:bg-blue-50/50 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)]">#{{ u.id }}</td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {{ u.username.charAt(0).toUpperCase() }}
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">{{ u.username }}</div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 truncate max-w-[200px]" :title="u.reason">{{ u.reason || '-' }}</div>
              </td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-500">
                <span :class="roleClass(u.role)" class="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full">
                  {{ t.userRole[u.role] || u.role }}
                </span>
              </td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-500">
                <span :class="statusClass(u.status)" class="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full flex items-center w-fit">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="statusDotClass(u.status)"></span>
                  {{ t.userStatus[u.status] || u.status }}
                </span>
              </td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{{ u.points ?? 0 }}</td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(u.created_at) }}</td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                <button v-if="u.status === 'pending'" @click="updateUserStatus(u.id, 'active')" class="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors">{{ t.approve }}</button>
                <button v-if="u.status !== 'banned' && u.role !== 'admin'" @click="updateUserStatus(u.id, 'banned')" class="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors">{{ t.ban }}</button>
                <button v-if="u.status === 'banned'" @click="updateUserStatus(u.id, 'active')" class="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors">{{ t.unban }}</button>
                <button v-if="u.role !== 'super_admin' && (user.role === 'super_admin' || u.role !== 'admin')" @click="resetUserPassword(u.id, u.username)" class="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">{{ t.resetPassword }}</button>
                <button v-if="u.role !== 'admin'" @click="updateUserRole(u.id, 'admin')" class="text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors">{{ t.setAdmin }}</button>
                <button v-if="user.role === 'super_admin' && u.role === 'admin'" @click="updateUserRole(u.id, 'user')" class="text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg transition-colors">{{ t.revokeAdmin }}</button>
                <button v-if="user.role === 'super_admin' && u.role !== 'super_admin'" @click="deleteUser(u.id)" class="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors">{{ t.deleteUser }}</button>
                <button @click="viewUserDetails(u)" class="text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors">{{ t.viewDetails }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  users: { type: Array, required: true },
  totalUsers: { type: Number, required: true },
  currentUserPage: { type: Number, required: true },
  usersPerPage: { type: Number, required: true },
  totalUserPages: { type: Number, required: true },
  userSearchQuery: { type: String, required: true },
  userStatusFilter: { type: String, required: true },
  user: { type: Object, required: true },
  t: { type: Object, required: true },
  formatDate: { type: Function, required: true },
  changeUserPage: { type: Function, required: true },
  setUsersPerPage: { type: Function, required: true },
  setUserSearchQuery: { type: Function, required: true },
  setUserStatusFilter: { type: Function, required: true },
  changeUsersPerPage: { type: Function, required: true },
  handleUserSearch: { type: Function, required: true },
  handleUserStatusFilter: { type: Function, required: true },
  clearUserSearch: { type: Function, required: true },
  updateUserStatus: { type: Function, required: true },
  resetUserPassword: { type: Function, required: true },
  updateUserRole: { type: Function, required: true },
  deleteUser: { type: Function, required: true },
  viewUserDetails: { type: Function, required: true }
});

const roleClass = (role) => ({
  'bg-purple-100 text-purple-700 ring-1 ring-purple-600/20': role === 'admin',
  'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-600/20': role === 'super_admin',
  'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10': role === 'user'
});

const statusClass = (status) => ({
  'bg-green-100 text-green-700 ring-1 ring-green-600/20': status === 'active',
  'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20': status === 'pending',
  'bg-red-100 text-red-700 ring-1 ring-red-600/20': status === 'banned'
});

const statusDotClass = (status) => ({
  'bg-green-500': status === 'active',
  'bg-amber-500': status === 'pending',
  'bg-red-500': status === 'banned'
});
</script>
