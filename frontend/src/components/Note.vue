<script setup lang="ts">
	import {computed, toRefs, Ref} from 'vue';
	import { page_control, note_editor } from '../main';
	import type {Note} from '../models/graph';
	
	const props = defineProps<{
		note: Ref<Note>,
	}>();
	const {note} = toRefs(props);

	// Show icons, not controls:
	// //ok - is root of thread
	// - is end of thread (stop icon)
	// //ok - has thread-outs
	// - has other relations 
	// //ok - thread-out and relations in current edit

	const num_thread_out = computed( () => {
		let num = 0;
		note.value.relations.forEach(r => {
			if( r.label === 'thread-out' && r.target === note.value.id ) ++num;
		});
		return num;
	});

</script>

<template>
	<div class="flex flex-col hover:bg-yellow-50 md:flex-row" :class="{'bg-yellow-200':page_control.selected_note_id.value === note.id}" @click="page_control.selectNote(note.id)">
		<div class="flex-shrink-0 text-gray-500 md:w-28">{{note.created.toLocaleTimeString()}}</div>
		<div class="md:border-l-2 md:pl-1 border-amber-700 flex-grow md:pb-1" >
			<p class="">{{note.contents}}</p>
		</div>
		
		<div class="flex flex-shrink-0 justify-end self-end md:w-40 md:self-start">
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
</template>