<script setup lang="ts">
import {computed} from 'vue';
import { useThreadsStore } from '../stores/threads';
import { useUIStateStore } from '../stores/ui_state';

import ThreadUI from './Thread.vue';

const threadsStore = useThreadsStore();
const uiStateStore = useUIStateStore();

const context_thread = computed( () => {
	return threadsStore.getThread(uiStateStore.context_id);
});

</script>
<template>

	<div class="absolute top-0 h-full inline-flex z-20"
		:class="{'hidden':!uiStateStore.show_threads, 'w-screen': !uiStateStore.pin_threads}">
		<div class="bg-gray-100  pb-4 overflow-y-scroll overflow-x-scroll"
			:style="'width:'+uiStateStore.threads_width+'px'">
			<div class="flex justify-between m-2">
				<button @click="uiStateStore.hideThreads()" 
					class="py-1 px-2 border border-gray-700 text-gray-700 rounded-lg bg-white hover:bg-yellow-50">
					<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-list-tree" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<path d="M9 6h11"></path>
						<path d="M12 12h8"></path>
						<path d="M15 18h5"></path>
						<path d="M5 6v.01"></path>
						<path d="M8 12v.01"></path>
						<path d="M11 18v.01"></path>
					</svg>
				</button>
				<button v-if="uiStateStore.threads_pinnable && uiStateStore.pin_threads" @click="uiStateStore.unPinThreads()"
					class="py-1 px-2 border border-gray-700 text-gray-500 rounded-lg bg-white hover:bg-yellow-50">
					<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pinned" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<path d="M9 4v6l-2 4v2h10v-2l-2 -4v-6"></path>
						<path d="M12 16l0 5"></path>
						<path d="M8 4l8 0"></path>
					</svg>
				</button>
				<button v-else-if="uiStateStore.threads_pinnable" @click="uiStateStore.pinThreads()"
					class="py-1 px-2 border border-gray-700 text-gray-700 rounded-lg hover:bg-white">
					<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pinned" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<path d="M9 4v6l-2 4v2h10v-2l-2 -4v-6"></path>
						<path d="M12 16l0 5"></path>
						<path d="M8 4l8 0"></path>
					</svg>
				</button>
			</div>
			<ThreadUI v-if="context_thread"  :thread="context_thread" :is_root="true"></ThreadUI>
		</div>
		<div @click="uiStateStore.hideThreads()"
			class="bg-white opacity-50 grow">
		</div>
	</div>
	<div v-if="!uiStateStore.show_threads" class="absolute top-2 z-20 left-2">
		<button @click="uiStateStore.showThreads()"
			class="py-1 px-2 border border-gray-700 text-gray-700 rounded-lg bg-gray-50 hover:bg-yellow-50">
			<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-list-tree" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<path d="M9 6h11"></path>
				<path d="M12 12h8"></path>
				<path d="M15 18h5"></path>
				<path d="M5 6v.01"></path>
				<path d="M8 12v.01"></path>
				<path d="M11 18v.01"></path>
			</svg>
		</button>
	</div>
</template>