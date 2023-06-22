<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import { useUIStateStore } from '../models/ui_state';
import { useThreadsStore } from '../models/threads';

import ThreadUI from './Thread.vue';
import type {Thread} from '../models/threads';

const uiStateStore = useUIStateStore();
const threadsStore = useThreadsStore();

const props = defineProps<{
	thread: Thread,
	is_root?: boolean
}>();

const selected = computed( () => uiStateStore.selected_threads.has(props.thread.id) );
function threadClicked() {
	if( selected.value ) uiStateStore.deselectThread(props.thread.id);
	else uiStateStore.selectThread(props.thread.id);
}

const children = computed( () => {
	return [...threadsStore.getChildren(props.thread.id)].reverse();
});

const has_children = computed( () => props.thread.num_children !== 0 );
const show_children = computed( () => {
	return props.thread.num_children !== 0 && uiStateStore.expanded_threads.has(props.thread.id);
});

async function loadChildren() {
	await threadsStore.loadChildren(props.thread.id, children.value.length + 10);
}
</script>

<template>
	<div class="border-blue-500 pl-2" :class="{'border-l': false && !props.is_root}">
		<div class="py-1 flex" >
			<div class="" :class="{'text-gray-300':!has_children}" @click="uiStateStore.toggleExpandedThread(props.thread.id)">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5" :class="[show_children ? 'rotate-90':'']">
					<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
				</svg>
			</div>
			<div class="" >
				<div class="px-1 rounded cursor-pointer hover:bg-yellow-100"
					:class="[selected ? 'bg-yellow-200' : '']"
					@click="threadClicked">{{props.thread.name}}</div>
				<div v-if="show_children" class="ml-3 inline-flex rounded items-center px-1 bg-gray-200" >
					<span class="text-sm font-medium text-gray-500">{{ children.length }}
						<template v-if="children.length !== props.thread.num_children">of {{ props.thread.num_children }}</template>
					</span>
					<button v-if="children.length !== props.thread.num_children" class="ml-1 flex text-sm text-blue-500 underline" @click="loadChildren">
						load more
					</button>
				</div>
			</div>
		</div>
		<div v-if="show_children">
			<ThreadUI v-for="t in children" :thread="t"></ThreadUI>
		</div>
	</div>
</template>