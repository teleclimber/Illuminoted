<script setup lang="ts">
import {computed, watch, ref, onUpdated, nextTick} from 'vue';
import type {Ref} from 'vue';

import {notes_graph} from '../main';
import type {Note} from '../models/graph';

import NoteUI from './Note.vue';

type StackItem = {
	note: Ref<Note>,
	date: string,
	show_date: boolean,
	thread: string,
	show_thread: boolean,
	is_root: boolean,
	parent: string
}

const stack = computed( () => {
	let prev :StackItem|undefined;
	return notes_graph.sorted_notes.value.map( n => {

		const date = n.value.created.toLocaleDateString();
		const show_date = !prev || prev.date !== date;

		const show_thread = !prev || show_date || prev.note.value.thread !== n.value.thread;
		const thread = show_thread ? notes_graph.mustGetThread(n.value.thread).contents : '';

		const is_root = n.value.thread === n.value.id;
		let parent = "";
		if( is_root ) {
			const rel = n.value.relations.find( r => {
				return r.label === 'thread-out' && r.source === n.value.id;
			});
			if( rel ) {
				const p = notes_graph.getNote(rel.target);
				if( p ) parent = p.value.contents;
			}
		}
		
		const s :StackItem = {
			note:n,
			date,
			show_date,
			thread,
			show_thread,
			is_root,
			parent
		};
		prev = s;
		return s;
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
			<template v-for="s in stack" :key="s.note.value.id">
				<div v-if="s.show_date" class="font-bold">
					<div class="pt-2">{{s.date}}</div>
				</div> 
				<div v-if="s.is_root" class="text-sm flex">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
					<p v-if="s.parent">{{s.parent}}</p>
					<p v-else>(Parent note not found)</p>
				</div>
				<div v-else-if="s.show_thread || s.show_date" class="text-sm flex">
					<div v-if="s.thread" class="italic text-amber-800 h-5 overflow-clip">
						{{s.thread}}
					</div>
					<div v-else>(thread not found)</div>
				</div>
				<NoteUI :note="s.note" ></NoteUI>
			</template>
			
		</div>
		<div class="h-96">&nbsp;</div>
    </div>
</template>