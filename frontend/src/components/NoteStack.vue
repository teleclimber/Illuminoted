<script setup lang="ts">
import {computed, watch, ref, onMounted, onUpdated, nextTick} from 'vue';
import type {Ref} from 'vue';

import {notes_graph, note_editor} from '../main';
import type {Note, Thread} from '../models/graph';

import NoteUI from './Note.vue';

export interface UINote {
  note: Note,
  prev: UINote|undefined,
  next: UINote|undefined, 
}

const ui_notes = computed( () => {
	let prev :UINote|undefined;
	return notes_graph.sorted_notes.value.map( n => {
		const ui_note :UINote = {
			note:n,
			prev: prev,
			next: undefined, 
		};
		if( prev ) prev.next = ui_note;
		prev = ui_note;
		return ui_note;
	});
});

let loading = false;
const load_more_elem :Ref<HTMLElement|undefined> = ref();
const observer = new IntersectionObserver(async () => {
	if( loading ) return;
	loading = true;
	await loadMoreNotes();
	loading = false;
}, {threshold: 0.1});
watch( load_more_elem, () => {
	if( !load_more_elem.value ) return;
	observer.observe(load_more_elem.value);
});

const buffer_elem :Ref<HTMLElement|undefined> = ref();
const notes_measurer :Ref<HTMLElement|undefined> = ref();
const buffer_height = ref('');
let orig_notes_h = 0;
let scroll = 0;
window.addEventListener( 'scroll', () => {
	scroll = window.scrollY;
});

const shift = 10000;
async function loadMoreNotes() {
	if( !notes_measurer.value ) return;
	orig_notes_h = notes_measurer.value.offsetHeight;
	buffer_height.value = shift + 'px';
	nextTick( () => {
		window.scrollTo({top:window.scrollY+shift}); 
	});
	
	await notes_graph.getMoreNotes();
}

onUpdated( () => {
	if( !notes_measurer.value ) return;
	if( buffer_height.value === '' ) return;
	const new_notes_h = notes_measurer.value.offsetHeight;
	if( new_notes_h === orig_notes_h ) return;  // notes have not updated yet
	buffer_height.value = '';
	nextTick( () => {
		window.scrollTo({top:scroll-shift+new_notes_h-orig_notes_h}); 
	});
});

</script>

<template>
	<div class="px-4 " >
		<a href="#" ref="load_more_elem" @click.stop.prevent="loadMoreNotes()" class="block border my-2 text-center text-gray-500 italic" style="height: 500px">
			load more notes
		</a>
		<div ref="buffer_elem" :style="{height:buffer_height}"></div>
		<div ref="notes_measurer">
			<NoteUI v-for="ui_note in ui_notes" :ui_note="ui_note" :edit_rel="note_editor.getRel(ui_note.note.id)" :key="ui_note.note.id"></NoteUI>
		</div>
    </div>
</template>