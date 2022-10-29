<script setup lang="ts">
import { computed } from '@vue/reactivity';
import {ref, Ref, watch } from 'vue';
import { notes_graph, note_editor } from '../main';
import type { EditRel } from '../models/graph';

import LazyNoteHint from './LazyNoteHint.vue';
import RelationIcon from './RelationIcon.vue';

const text_input_elem :Ref<HTMLInputElement|undefined> = ref();
watch( text_input_elem, () => {
	if( !text_input_elem.value ) return;
	text_input_elem.value.focus();
});

const rels = computed( () => {
	return note_editor.rel_edit.filter( r => r.action !== 'delete' );
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

const thread = note_editor.thread;
const contents = note_editor.contents;

const saving = ref(false);
async function saveNote() {
	saving.value = true;
	await note_editor.saveNote();
	saving.value = false;

	// after that, maybe pre-select the last or newest thread to follow on?
}
function reset() {
	if( !saving.value ) note_editor.reset();
}
function removeRel(d:EditRel) {
	note_editor.editRelation(d.note_id, d.label, false);
}

</script>

<template>
	<div v-if="note_editor.has_data.value" class="p-2 bg-white border-t-2">
		<p v-if="thread" class="italic text-amber-800 max-w-prose whitespace-nowrap overflow-clip">Thread: {{thread.contents}}</p>
		<ul>
			<li v-for="d in rels" class="flex flex-nowrap">
				<RelationIcon :label="d.label" class="h-5 w-5 flex-shrink-0"></RelationIcon>
				<span class="flex-shrink-0">{{sourceLabel(d.label)}}:</span>
				<LazyNoteHint :note="notes_graph.lazyGetNote(d.note_id)" class="flex-shrink"></LazyNoteHint>
				<button
					v-if="d.label !== 'thread-out'"
					class="bg-blue-600 text-white px-2 py-1 text-sm uppercase rounded disabled:bg-gray-200"
					@click.stop.prevent="removeRel(d)"> x </button>
			</li>
		</ul>
		<div>
			<textarea ref="text_input_elem" v-model="contents" class="w-full h-32 border"></textarea>
		</div>
		<div class="flex justify-between">
			<button
				class="bg-blue-600 text-white px-4 py-2 text-sm uppercase rounded disabled:bg-gray-200"
				:disabled="saving"
				@click.stop.prevent="reset()">Cancel</button>
			<button 
				class="bg-blue-600 text-white px-4 py-2 text-sm uppercase rounded"
				@click.stop.prevent="saveNote()">Save</button>
		</div>
	</div>

</template>