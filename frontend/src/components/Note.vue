<script setup lang="ts">
	import {computed, toRefs} from 'vue';
	import type {UINote} from './NoteStack.vue';
	const props = defineProps<{
		ui_note: UINote
	}>();
	const {ui_note} = toRefs(props);
	const note = computed( () => ui_note.value.note );
	const thread = computed( () => ui_note.value.thread );
	const prev = computed( () => ui_note.value.prev );
	const next = computed( () => ui_note.value.next );

	const show_date = computed( () => {
		return !prev.value || prev.value.note.created.toLocaleDateString() != note.value.created.toLocaleDateString();
	});
    const show_thread = computed( () => {
		return !prev.value || prev.value.note.thread != note.value.thread;
	});

	// show following metadata:
	// - nothing if next note is the follower (let it flow)
	// - link to follower (or however it's handled) if next is not follower
	// - "reply" UI if last of thread (not target of "follows" relation)

	// it's possible that instead of "prev" "next" links, we have one control that removes the other threads?
	// This could tie in with thread navigator / selector, where I imagine we can click on an "eye" button to show/hide
	const follows_id = computed( () => {
		const f = note.value.relations.find( r => r.label === "follows" && r.source == note.value.id );
		return f?.target;
	});
	const show_prev_control = computed( () => {
		return !!follows_id.value && follows_id.value != prev.value?.note.id;
	});
	const follower_id = computed( () => {
		const f = note.value.relations.find( r => r.label === "follows" && r.target == note.value.id );
		return f?.source;
	});
	const show_next_control = computed( () => {
		return !!follower_id.value && (!next.value || follower_id.value != next.value?.note.id);
	});
</script>

<template>
	<div>
		<div v-if="show_date" class="font-bold ml-28">
			<div class="border-amber-700 pl-1 pt-2" :class="{'border-l-2':show_thread}">
				{{note.created.toLocaleDateString()}}
			</div>
		</div> 
		<div v-if="show_thread" class="text-sm pl-28 pt-2 flex">
			<div class="italic text-amber-800 max-w-prose whitespace-nowrap overflow-clip">
				{{thread.root.contents}}
			</div>
			
		</div>

		<div class="flex ">
			<div class="py-1 w-28 flex-shrink-0 text-gray-500">{{note.created.toLocaleTimeString()}}</div>
			<div class="py-1 border-l-2 pl-1 border-amber-700 flex-grow" >
				<p class="max-w-prose">{{note.contents}}</p>
			</div>
			<div class="w-52 py-2 flex items-start">
				<a href="#" v-if="show_prev_control" class="ml-2 flex items-center rounded bg-slate-300 px-1">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
					</svg>
				</a>
				<a href="#" v-if="show_next_control" class="ml-2 flex items-center rounded bg-slate-300 px-1">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</template>