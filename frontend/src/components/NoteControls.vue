<script setup lang="ts">
import {ref, computed, ComputedRef, Ref } from 'vue';
import { useNotesGraphStore } from '../stores/graph';
import { useNoteEditorStore } from '../stores/note_editor';
import { useUIStateStore } from '../stores/ui_state';

import type {Note} from '../stores/graph';
import LazyNoteHint from './LazyNoteHint.vue';
import RelationIcon from './RelationIcon.vue';
import { useThreadsStore } from '../stores/threads';

const notesStore = useNotesGraphStore();
const threadsStore = useThreadsStore();
const noteEditorStore = useNoteEditorStore();
const uiStateStore = useUIStateStore();

const note = computed( () => {
	if( !uiStateStore.selected_note_id ) return undefined;
	const n = notesStore.getNote(uiStateStore.selected_note_id);
	if( n ) return n.value;
});

//  controls:
// - thread situational awareness (above, show thread, and maybe stack), click to nav
//   ..maybe just show the thread, and clicking the thread opesn the threads UI with that highlighted.
// - nav: next in thread(?), end of thread(later, we need id of end of thread), thread outs, other relations
// - note interactions: reply (if last of thread), thread out, relate in other ways (later)

// Buttons:
// - Create note in same thread (should not be needed)
// - Create note with reply relation 
// - Create new note in new thread with thread-out as relation
// - Edit the note (including relations?)

// info:
// - thread snip (clickable) if not root OR thread parent if root
// - thread-outs
// - other relations

const thread = computed( () => {
	if( !note.value ) return undefined;
	return threadsStore.getThread(note.value.thread);
});

const show = computed( () => note.value && !noteEditorStore.has_data );

type Rel = {
	label: string,
	note_id: number,
	note: Ref<Note|undefined>
}
const rels :ComputedRef<{parent:Rel|undefined,targets:Rel[],sources:Rel[]}> = computed( () => {
	const ret :{
		parent: Rel|undefined,
		targets: Rel[],
		sources: Rel[]
	} = {
		parent: undefined,
		targets: [],
		sources: []
	};
	if( !note.value ) return ret;
	const n = note.value;
	n.relations.forEach( r => {
		if( r.source === n.id ) {
			const rel = {
				label: r.label,
				note_id: r.target,
				note: notesStore.lazyGetNote(r.target)
			};
			if( (r.label === 'thread-out' || r.label === 'in-reply-to') && !ret.parent ) {
				ret.parent = rel;
			}
			else {
				ret.sources.push(rel);
			}
		}
		else {
			ret.targets.push({
				label: r.label,
				note_id: r.source,
				note: notesStore.lazyGetNote(r.source)
			});
		}
	});

	return ret;
});

const source_labels = {
	'thread-out':	'Thread out from',
	'in-reply-to':	'In reply to',
	'see-also':		'See also'
}
function sourceLabel(label:string) :string {
	// @ts-ignore because com'on 
	return source_labels[label] || label;
}
const target_labels = {
	'thread-out':	'Thread below',
	'in-reply-to':	'Reply',
	'see-also':		'See also'
}
function targetLabel(label:string) :string {
	// @ts-ignore because com'on 
	return target_labels[label] || label;
}

function appendToThread() {
	if( !note.value ) return;
	noteEditorStore.appendToThread(note.value.thread);
	uiStateStore.deselectNote();
}

function threadOut() {
	if( !note.value ) return;
	noteEditorStore.threadOut(note.value.id);
	uiStateStore.deselectNote();
}

function editNote() {
	if( !note.value ) return;
	noteEditorStore.editNote(note.value.id);
	uiStateStore.deselectNote();
}

function editThread() {
	if( !note.value ) return;
	uiStateStore.showEditThread(note.value.thread);
}

const expand_thread = ref(false);

</script>

<template>
	<div v-if="show" class="p-2 bg-white border-t-2">
		<div v-if="rels.parent" class="flex flex-nowrap" :class="{'h-auto':expand_thread}"
			@click="uiStateStore.scrollToNote(rels.parent?.note_id)">
			<span class="flex-shrink-0 w-24 flex justify-start">
				<RelationIcon :label="rels.parent.label" class="h-4 w-4 flex-shrink-0"></RelationIcon>
				<span class="flex-shrink-0 px-1 italic text-sm text-gray-600">{{sourceLabel(rels.parent.label)}}:</span>
			</span>
			<LazyNoteHint :note="rels.parent.note" class="flex-shrink"></LazyNoteHint>
		</div>
		<div v-if="thread" class="italic text-amber-800 h-6 overflow-y-hidden" :class="{'h-auto':expand_thread}" @click.stop.prevent="expand_thread = !expand_thread">Thread: {{thread.name}}</div>
		<div v-for="r in rels.sources" class="flex flex-nowrap"
			@click="uiStateStore.scrollToNote(r.note_id)">
			<span class="flex-shrink-0 w-24 flex justify-start">
				<RelationIcon :label="r.label" class="h-4 w-4 flex-shrink-0"></RelationIcon>
				<span class="flex-shrink-0 px-1 italic text-sm text-gray-600">{{sourceLabel(r.label)}}:</span>
			</span>
			<LazyNoteHint :note="r.note" class="flex-shrink"></LazyNoteHint>
		</div>
		<div v-for="r in rels.targets" class="flex flex-nowrap"
			@click="uiStateStore.scrollToNote(r.note_id)">
			<span class="flex-shrink-0 w-24 flex justify-start">
				<RelationIcon :label="r.label" class="h-4 w-4 mr-1 flex-shrink-0"></RelationIcon>
				<span class="flex-shrink-0 px-1 italic text-sm text-gray-600">{{targetLabel(r.label)}}:</span>
			</span>
			<LazyNoteHint :note="r.note" class="flex-shrink"></LazyNoteHint>
		</div>
		
		<div class="grid grid-cols-4 gap-1 h-8">
			<button v-if="true" @click.stop.prevent="appendToThread()" class="flex justify-center items-center rounded bg-slate-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 rotate-90 " viewBox="0 0 24 24"> <g> <path fill="none" d="M0 0h24v24H0z"/> <path d="M15.874 13a4.002 4.002 0 0 1-7.748 0H3v-2h5.126a4.002 4.002 0 0 1 7.748 0H21v2h-5.126zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/> </g> </svg> 
			</button>
			<button @click.stop.prevent="threadOut()" class="flex justify-center items-center rounded bg-slate-300 ">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
			</button>
			<button @click.stop.prevent="editThread()" class="flex justify-center items-center rounded bg-slate-300">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
				</svg>
			</button>
			<button @click.stop.prevent="editNote()" class="flex justify-center items-center rounded bg-slate-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
					<path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
					<path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
	</div>
</template>
