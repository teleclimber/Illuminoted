<script setup lang="ts">
import {ref, computed, ComputedRef, Ref } from 'vue';
import { useNotesGraphStore } from '../stores/graph';
import { useNoteEditorStore } from '../stores/note_editor';
import { useUIStateStore } from '../stores/ui_state';

const notesStore = useNotesGraphStore();
const noteEditorStore = useNoteEditorStore();
const uiStateStore = useUIStateStore();

const show = computed( () => uiStateStore.selected_threads.size && !uiStateStore.selected_note_id && !noteEditorStore.has_data );

function addNote() {
	// - if no threads selected then no-op (should be disabled button)
	// - if only one thread selected, use that
	// - if more than one, use most recent added note? But where is that stashed? graph?
	// - if no recent new notes that match thread(!) then pick a thread at random.
	const threads = uiStateStore.selected_threads;
	if( threads.size === 0 ) return;
	let t = threads.values().next().value!;
	if( threads.size !== 1 ) {
		const last_t = notesStore.getLastNewNoteThreadID();
		if(last_t !== undefined && threads.has(last_t)) {
			t = last_t;
		}
	}
	noteEditorStore.appendToThread(t);
}
	
</script>

<template>
	<div v-if="show" class="pl-1 pb-1">
		<button v-if="true" @click.stop.prevent="addNote()" class="flex justify-center items-center rounded p-2 border-2 border-sky-600 text-white bg-sky-600 hover:bg-sky-500 border-t-sky-400 border-b-sky-800">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
			</svg>
			<span class="text-sm uppercase pl-1">add note</span>

		</button>
	</div>
</template>