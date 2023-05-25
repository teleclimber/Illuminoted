<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import { useNotesGraphStore } from '../models/graph';

import ThreadUI from './Thread.vue';
import type {Thread} from '../models/graph';

const notesStore = useNotesGraphStore();

const props = defineProps<{
	thread: Thread,
	is_root?: boolean
}>();

const show_full = ref(false);

const data_sel_value = computed( () => notesStore.selected_threads.has(props.thread.id) );
const sel_input_value = ref(data_sel_value.value);
watch( sel_input_value, (new_val) => {
	if( new_val ) notesStore.selectThread(props.thread.id);
	else notesStore.deselectThread(props.thread.id);
});
watch( data_sel_value, (new_val) => sel_input_value.value = new_val);

const has_children = computed( () => props.thread.children.length === 0 );
const show_children = computed( () => {
	return notesStore.expanded_threads.has(props.thread.id);
});
</script>

<template>
	<div class="border-blue-500 pl-4" :class="{'border-l': false && !props.is_root}">
		<div class="py-1 flex cursor-pointer hover:bg-yellow-50" >
			<div class="pr-2" :class="{'text-gray-400':has_children}" @click="notesStore.toggleExpandedThread(props.thread.id)">
				<svg v-if="show_children" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div class="pr-2">
				<input type="checkbox" v-model="sel_input_value" />
			</div>

			<div class="flex-grow flex flex-col" @click="show_full = !show_full">
				<div class="">{{props.thread.contents}}</div>
				<div class="flex">
					<div class="text-gray-500  ">{{props.thread.created.toLocaleDateString()}}</div>
					<a :href="'/'+thread.id" class="px-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
						</svg>
					</a>
				</div>
			</div>
			
		</div>
		<div v-if="show_children">
			<ThreadUI v-for="t in props.thread.children" :thread="t"></ThreadUI>
		</div>
	</div>

</template>