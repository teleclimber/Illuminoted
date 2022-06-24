<script setup lang="ts">
import {ref, computed } from 'vue';
import { page_control, notes_graph, note_editor } from '../main';

const note = computed( () => {
	if( !page_control.selected_note_id.value ) return undefined;
	const n = notes_graph.getNote(page_control.selected_note_id.value);
	if( n ) return n.value;
});

//  controls:
// - thread situational awareness (above, show thread, and maybe stack), click to nav
//   ..maybe just show the thread, and clicking the thread opesn the threads UI with that highlighted.
// - nav: next in thread(?), end of thread(later, we need id of end of thread), thread outs, other relations
// - note interactions: reply (if last of thread), thread out, relate in other ways (later)

// buttons:
// - Go to end of thread or reply (if last of thread)
// - Thread out
// - Add relation to edited note
// - Edit note

// info:
// - thread snip (clickable) if not root OR thread parent if root
// - thread-outs
// - other relations

const thread = computed( () => {
	if( !note.value ) return undefined;
	return notes_graph.getThread(note.value.thread);
});

const parent = computed( () => {
	if( !note.value ) return undefined;
	const rel = note.value.relations.find( r => {
		return r.label === 'thread-out' && r.source === note.value?.id;
	});
	if( !rel ) return undefined;
	const n = notes_graph.getNote(rel.target);
	if( n ) return n.value;
});

const thread_outs = computed( () => {
	if( !note.value ) return [];
	return note.value.relations.filter( (r) => {
		return r.label === "thread-out" && r.target === note.value?.id;
	}).map( r => {
		return notes_graph.getNote(r.source)
	}).filter( r => !!r );
});

function appendToThread() {
	if( !note.value ) return;
	note_editor.appendToThread(note.value.thread);
	page_control.deselectNote();
}

function threadOut() {
	if( !note.value ) return;
	note_editor.threadOut(note.value.id);
	page_control.deselectNote();
}

function editNote() {
	if( !note.value ) return;
	note_editor.editNote(note.value.id);
	page_control.deselectNote();
}

const expand_thread = ref(false);

</script>

<template>
	<div v-if="note" class="p-2 bg-white border-t-2">
		<div v-if="parent" class="h-6 overflow-y-hidden" :class="{'h-auto':expand_thread}" @click.stop.prevent="expand_thread = !expand_thread">Parent: {{parent.contents}}</div>
		<div v-if="thread" class="h-6 overflow-y-hidden" :class="{'h-auto':expand_thread}" @click.stop.prevent="expand_thread = !expand_thread">Thread: {{thread.contents}}</div>
		<div v-for="n in thread_outs" class="flex h-6 overflow-y-hidden">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
			{{n?.value.contents}}
		</div>
		
		<div class="grid grid-cols-4 gap-1 h-8">
			<button v-if="true" @click.stop.prevent="appendToThread()" class="flex justify-center items-center rounded bg-slate-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 rotate-90 " viewBox="0 0 24 24"> <g> <path fill="none" d="M0 0h24v24H0z"/> <path d="M15.874 13a4.002 4.002 0 0 1-7.748 0H3v-2h5.126a4.002 4.002 0 0 1 7.748 0H21v2h-5.126zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/> </g> </svg> 
			</button>
			<button @click.stop.prevent="threadOut()" class="flex justify-center items-center rounded bg-slate-300 ">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
			</button>
			<button @click.stop.prevent="editNote()" class="flex justify-center items-center rounded bg-slate-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
					<path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
					<path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
				</svg>
			</button>
			<button class="flex justify-center items-center rounded bg-slate-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24"> <g> <path fill="none" d="M0 0h24v24H0z"/> <path d="M15 5h2a2 2 0 0 1 2 2v8.17a3.001 3.001 0 1 1-2 0V7h-2v3l-4.5-4L15 2v3zM5 8.83a3.001 3.001 0 1 1 2 0v6.34a3.001 3.001 0 1 1-2 0V8.83zM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm12 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/> </g> </svg> 
			</button>
		</div>
	</div>
</template>
