<script setup lang="ts">
import {computed, watch, ref, onMounted, onUpdated, nextTick, onUnmounted} from 'vue';
import type {Ref} from 'vue';
import { useNotesGraphStore } from '../stores/graph';
import type {Note} from '../stores/graph';
import { Thread, useThreadsStore } from '../stores/threads';
import { useNoteStackStore } from '../stores/note_stack';

import NoteUI from './Note.vue';

const threadsStore = useThreadsStore();
const notesStore = useNotesGraphStore();
const noteStackStore = useNoteStackStore();

const scroll_container :Ref<HTMLElement|undefined> = ref();
const upper_stack_container :Ref<HTMLElement|undefined> = ref(); 
const upper_stack_measurer :Ref<HTMLElement|undefined> = ref();
const upper_stack_buffer = 50000;
let upper_stack_height = upper_stack_buffer;

type StackItem = {
	note: Ref<Note>,
	date: string,
	show_date: boolean,
	thread: Thread | undefined,
	show_thread: boolean,
	is_root: boolean,
	parent: Ref<string>
}

const stacks = computed( () => {
	const ret :{upper:StackItem[], lower:StackItem[]} = {upper: [], lower: []};
	let cur_stack = ret.upper;
	const target_date = noteStackStore.getTargetDate();
	const target_note_id = noteStackStore.getTargetNoteID();
	let prev :StackItem|undefined;
	
	notesStore.sorted_notes.forEach( n => {
		const date = n.value.created.toLocaleDateString();
		const show_date = !prev || prev.date !== date;
		const is_root = n.value.thread === n.value.id;
		const show_thread = !is_root && (!prev || show_date || prev.note.value.thread !== n.value.thread);
		let thread;
		if( show_thread ) thread = threadsStore.addLazyLoadThread(n.value.thread);
		let parent = ref("loading...");
		if( is_root ) {
			const rel = n.value.relations.find( r => {
				return r.label === 'thread-out' && r.source === n.value.id;
			});
			if( rel ) {
				notesStore.getLoadNote(rel.target).then( n => {
					parent.value = n.value.contents;
				});
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
		if( target_date && target_date < n.value.created ) cur_stack = ret.lower;
		cur_stack.push(s);
		if( target_note_id === n.value.id ) cur_stack = ret.lower;
		return s;
	});

	threadsStore.fetchLazyLoadThreads(1);

	return ret;
});

const first_note_id = computed( () => {
	if( stacks.value.upper.length > 0 ) return stacks.value.upper[0].note.value.id;
	if( stacks.value.lower.length > 0 ) return stacks.value.lower[0].note.value.id;
});
const last_note_id = computed( () => {
	const l = stacks.value.lower
	if( l.length > 0 ) return l[l.length -1].note.value.id;
	const u = stacks.value.upper;
	if( u.length > 0 ) return u[u.length-1].note.value.id;
});

let notesIntersectObs :IntersectionObserver|undefined = undefined;
onMounted( () => {
	notesIntersectObs = new IntersectionObserver( (entries) => {
		entries.forEach( e => {
			const id = e.target.getAttribute('data-node-id');
			if( !id ) return;
			const note_id = Number(id);
			if( e.isIntersecting ) {
				noteStackStore.setNoteVisible(note_id);
				if( first_note_id.value && note_id === first_note_id.value ) {
					console.log("loading notes before");
					notesStore.getMoreNotesBefore();
				}
				if( last_note_id.value && note_id === last_note_id.value ) {
					notesStore.getMoreNotesAfter()
				}
			}
			else noteStackStore.setNoteInvisible(note_id);
		});
	});
});
onUnmounted( () => {
	if( notesIntersectObs ) notesIntersectObs.disconnect();
});

watch( () => noteStackStore.reset_scroll_ticker, () => {
	if( scroll_container.value === undefined ) return; //throw new Error("need that scroll container");
	scroll_container.value.scrollTop = upper_stack_height - 200;	//TODO use window height/2?
});

onUpdated( () => {
	if( !scroll_container.value || !upper_stack_container.value || !upper_stack_measurer.value ) return;
	const new_notes_h = upper_stack_measurer.value.offsetHeight;
	const delta = new_notes_h + upper_stack_buffer - upper_stack_height;
	if( delta > 0 ) {
		console.log("growing upper by ", delta);
		upper_stack_height = new_notes_h + upper_stack_buffer;
		upper_stack_container.value.style.height = upper_stack_height+'px';
		scroll_container.value.scrollBy({top:delta, behavior: 'instant'});
	}
});

const no_notes = computed( () => notesStore.sorted_notes.length === 0 );

// Icons from:
// https://fontawesomeicons.com/svg/icons/git-commit-line

</script>

<template>
	<div class="flex-grow overflow-y-scroll px-2" ref="scroll_container" >
		<div ref="upper_stack_container" class="flex flex-col justify-end no-anchor" :style="'height:'+upper_stack_height+'px'">
			<div ref="upper_stack_measurer">
				<template v-for="s in stacks.upper" :key="s.note.value.id">
					<div v-if="s.show_date" class="font-bold">
						<div class="pt-2">{{s.date}}</div>
					</div> 
					<div v-if="s.is_root" class="text-sm flex h-5 overflow-y-hidden">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
						<p>{{s.parent.value}}</p>
					</div>
					<div v-else-if="s.show_thread || s.show_date" class="text-sm flex">
						<div v-if="s.thread" class="italic text-amber-800 h-5 overflow-clip">
							{{s.thread.name}}
						</div>
					</div>
					<NoteUI :note="s.note" :iObs="notesIntersectObs"></NoteUI>
				</template>
			</div>
		</div>
		<div class="no-anchor">
			<template v-for="s in stacks.lower" :key="s.note.value.id">
				<div v-if="s.show_date" class="font-bold">
					<div class="pt-2">{{s.date}}</div>
				</div> 
				<div v-if="s.is_root" class="text-sm flex h-5 overflow-y-hidden">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg> 
					<p>{{s.parent.value}}</p>
				</div>
				<div v-else-if="s.show_thread || s.show_date" class="text-sm flex">
					<div v-if="s.thread" class="italic text-amber-800 h-5 overflow-clip">
						{{s.thread.name}}
					</div>
				</div>
				<NoteUI :note="s.note" :iObs="notesIntersectObs"></NoteUI>
			</template>
		</div>
		<div v-if="no_notes" class="text-gray-500 italic no-anchor">No notes... :(</div>
		<div class="h-56 no-anchor">&nbsp;</div>
	</div>
</template>

<style scoped>
.no-anchor {
	overflow-anchor: none;
}
</style>