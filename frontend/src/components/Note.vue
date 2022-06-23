<script setup lang="ts">
	import {computed, toRefs} from 'vue';
	import { page_control, notes_graph, note_editor } from '../main';
	
	import type {UINote} from './NoteStack.vue';

	const props = defineProps<{
		ui_note: UINote,
	}>();
	const {ui_note} = toRefs(props);
	const note = computed( () => ui_note.value.note );
	const prev = computed( () => ui_note.value.prev );
	const next = computed( () => ui_note.value.next );

	const show_date = computed( () => {
		return !prev.value || prev.value.note.created.toLocaleDateString() != note.value.created.toLocaleDateString();
	});
    const show_thread = computed( () => {
		return !prev.value || prev.value.note.thread != note.value.thread;
	});
	const thread = computed( () => {
		if( !show_thread.value && !show_date.value ) return undefined;
		return notes_graph.getThread(note.value.thread);
	});

	const is_thread_root = computed( () => {
		return note.value.id == note.value.thread;
	});

	// Show icons, not controls:
	// //ok - is root of thread
	// - is end of thread (stop icon)
	// //ok - has thread-outs
	// - has other relations 
	// - thread-out and relations in current edit

	const num_thread_out = computed( () => {
		let num = 0;
		note.value.relations.forEach(r => {
			if( r.label === 'thread-out' && r.target === note.value.id ) ++num;
		});
		return num;
	});

</script>

<template>
	<div>
		<div v-if="show_date" class="font-bold">
			<div class="pt-2">
				{{note.created.toLocaleDateString()}}
			</div>
		</div> 
		<div v-if="is_thread_root" class="text-sm flex">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
			Thread out from ...
		</div>
		<div v-else-if="show_thread || show_date" class="text-sm flex">
			<div v-if="thread" class="italic text-amber-800 h-5 overflow-clip">
				{{thread.contents}}
			</div>
			<div v-else>(thread not found)</div>
		</div>

		<div class="flex flex-col hover:bg-yellow-50 md:flex-row" :class="{'bg-yellow-200':page_control.selected_note_id.value === note.id}" @click="page_control.selectNote(note.id)">
			<div class="w-28 flex-shrink-0 text-gray-500">{{note.created.toLocaleTimeString()}}</div>
			<div class="md:border-l-2 md:pl-1 border-amber-700 flex-grow pb-1" >
				<p class="">{{note.contents}}</p>
			</div>
			
			<div class="flex w-40 flex-shrink-0 justify-end self-start">
				<span>&nbsp;</span>
				<span v-if="note_editor.parent_id && note_editor.parent_id.value === note.id" class="bg-yellow-200 px-2 rounded">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 					
				</span>
				<span v-if="num_thread_out" class="flex">
					{{num_thread_out}}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
				</span>
			</div>
		</div>
	</div>
</template>