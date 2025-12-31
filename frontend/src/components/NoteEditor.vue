<script setup lang="ts">
import { computed, reactive } from '@vue/reactivity';
import {nextTick, onMounted, ref, Ref, watch } from 'vue';
import { useUIStateStore } from '../stores/ui_state';
import { useNotesGraphStore } from '../stores/graph';
import { useNoteEditorStore } from '../stores/note_editor';
import { Thread, useThreadsStore } from '../stores/threads';

import type { EditRel } from '../stores/graph';

import LazyNoteHint from './LazyNoteHint.vue';
import RelationIcon from './RelationIcon.vue';

const uiStateStore = useUIStateStore();
const threadsStore = useThreadsStore();
const notesStore = useNotesGraphStore();
const noteEditorStore = useNoteEditorStore();

const text_input_elem :Ref<HTMLInputElement|undefined> = ref();
const new_thread_name_input :Ref<HTMLInputElement|undefined> = ref();
watch( [text_input_elem, new_thread_name_input], () => {
	if( new_thread_name_input.value ) new_thread_name_input.value.focus();
	else if( text_input_elem.value ) text_input_elem.value.focus();
});

const rels = computed( () => {
	return noteEditorStore.rel_edit.filter( r => r.action !== 'delete' );
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

// get selected threads

const threads_sel = computed( () => {
	const ret :Thread[] = []; 
	uiStateStore.selected_threads.forEach( thread_id => {
		ret.push(threadsStore.mustGetThread(thread_id))
	} );
	console.log(ret)
	return ret;
})

function createNewThread() {
	noteEditorStore.createNewThread();
	nextTick( () => {
		new_thread_name_input.value?.focus();
	});
}

const saving = ref(false);
const ok_to_save = computed( () => {
	if( saving.value ) return false;
	return !!noteEditorStore.ok_to_save;
});
async function saveNote() {
	saving.value = true;
	await noteEditorStore.saveNote();
	saving.value = false;

	// TODO after that, maybe pre-select the last or newest thread to follow on?
}

function removeRel(d:EditRel) {
	noteEditorStore.editRelation(d.note_id, d.label, false);
}

const btn_classes = ['border-y-2', 'bg-sky-600', 'hover:bg-sky-500',
	'border-b-sky-800', 'border-t-sky-400', 
	'disabled:bg-gray-400', 'disabled:border-gray-400', 'text-gray-200',
	'text-white',  'text-xs', 'font-medium', 'uppercase', 'rounded'];

</script>

<template>
	<div class="p-2 bg-gray-200 border-t-1">
		<div v-if="noteEditorStore.create_new_thread">
			<p  class="italic text-amber-800 ">
				Parent:
				<select v-model="noteEditorStore.thread_id" class="px-2 py-1 border bg-white	">
					<option v-for="thread in threads_sel" :value="thread.id">{{ thread.name }}</option>
				</select>
			</p>
			<p class="my-1 flex">
				New Thread:
				<input type="text" 
					v-model="noteEditorStore.new_thread_name" ref="new_thread_name_input"
					class="border mx-1 bg-white" />
				<button @click="noteEditorStore.useExistingThread()"
					class="px-2 py-0" :class="btn_classes">X</button>
			</p>
		</div>
		<p v-else class="text-amber-800 mb-2 flex">
			<span class="pt-1 pr-1">Thread:</span>
			<select v-model="noteEditorStore.thread_id" class="px-2 py-1 border bg-white">
				<option v-for="thread in threads_sel" :value="thread.id">{{ thread.name }}</option>
			</select>
			<!-- make thread selectable. Use list of selected threads. Use good defaults.
				One option is "new"	(or make "new" a button)-->
			<button @click="createNewThread"
				class="px-2 py-1 ml-2" :class="btn_classes">New thread</button>
		</p>
		<ul class="my-2">
			<li v-for="d in rels" class="flex flex-nowrap items-baseline">
				<span class="flex-shrink-0 w-24 flex justify-start">
					<RelationIcon :label="d.label" class="h-4 w-4 flex-shrink-0"></RelationIcon>
					<span class="px-1 italic text-sm text-gray-600">{{sourceLabel(d.label)}}:</span>
				</span>
				<LazyNoteHint :note="notesStore.lazyGetNote(d.note_id)" class="flex-shrink" @click.stop.prevent="uiStateStore.scrollToNote(d.note_id)"></LazyNoteHint>
				<button
					v-if="d.label !== 'thread-out'"
					class="px-3 py-1 "
					:class="btn_classes"
					@click.stop.prevent="removeRel(d)"> x </button>
			</li>
		</ul>
		<div>
			<textarea ref="text_input_elem"
				v-model="noteEditorStore.contents"
				class="w-full h-32 border bg-white"></textarea>
		</div>
		<div class="flex justify-between mt-1">
			<button
				class=" px-3 py-1 " :class="btn_classes"
				:disabled="saving"
				@click.stop.prevent="noteEditorStore.reset()">Cancel</button>
			<button 
				class="px-3 py-1" :class="btn_classes"
				:disabled="!ok_to_save"
				@click.stop.prevent="saveNote()">Save</button>
		</div>
	</div>

</template>