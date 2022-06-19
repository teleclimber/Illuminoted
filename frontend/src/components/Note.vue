<script setup lang="ts">
	import {computed, toRefs} from 'vue';
	import { notes_graph, note_editor } from '../main';
	
	import type {UINote} from './NoteStack.vue';

	const props = defineProps<{
		ui_note: UINote,
		edit_rel: "" | "follows" | "thread-out"	// ["link"]
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

	// show following metadata:
	// - nothing if next note is the follower (let it flow)
	// - link to follower (or however it's handled) if next is not follower
	// - "reply" UI if last of thread (not target of "follows" relation)

	// it's possible that instead of "prev" "next" links, we have one control that removes the other threads?
	// This could tie in with thread navigator / selector, where I imagine we can click on an "eye" button to show/hide
	const is_thread_root = computed( () => {
		return note.value.id == note.value.thread;
	});
	const show_prev_control = computed( () => {
		// show if previous shwon note is different thread.
		// Exception: if this note is the root of the thread.
		// (in which case we should make that visually clear)
		return !is_thread_root.value && (!prev.value || prev.value.note.thread != note.value.thread);
	});
	const next_is_follower = computed( () => {
		return next.value && next.value.note.thread === note.value.thread;
	});

</script>

<template>
	<div :class="{'bg-blue-400': !!props.edit_rel}">
		<div v-if="show_date" class="font-bold">
			<div class="pt-2">
				{{note.created.toLocaleDateString()}}
			</div>
		</div> 
		<div v-if="is_thread_root" class="text-sm">
			Thread out from ...
		</div>
		<div v-else-if="show_thread || show_date" class="text-sm flex">
			<div v-if="thread" class="italic text-amber-800 h-5 overflow-clip">
				{{thread.contents}}
			</div>
			<div v-else>(thread not found)</div>
			<a href="#" v-if="show_prev_control" class="ml-2 flex items-center rounded bg-slate-100 px-1">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
				</svg>
			</a>
		</div>

		<div class="flex flex-col hover:bg-yellow-50 md:flex-row">
			<div class="w-28 flex-shrink-0 text-gray-500">{{note.created.toLocaleTimeString()}}</div>
			<div class="md:border-l-2 md:pl-1 border-amber-700 flex-grow pb-1" >
				<p class="">
					{{note.contents}}
					<a href="#" v-if="!next_is_follower" class="ml-2 inline-flex items-center rounded bg-slate-100 px-1">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
					</a>
				</p>
			</div>
			
			<div class="flex justify-end items-end">
				<a href="#" v-if="true" @click.stop.prevent="note_editor.appendToThread(note.thread)" class="ml-2 flex items-center rounded bg-slate-300 px-1">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
					</svg>
				</a>
				<span v-else>&nbsp;</span>
				<a href="#" @click.stop.prevent="note_editor.threadOut(note.id)" class="ml-2 flex items-center rounded bg-slate-300 px-1">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</template>