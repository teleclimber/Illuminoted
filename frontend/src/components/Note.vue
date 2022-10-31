<script setup lang="ts">
import {computed, toRefs, Ref} from 'vue';
import { page_control, note_editor, notes_graph } from '../main';
import type {Note} from '../models/graph';

import RelationsControls from './RelationsControls.vue';
import RelationIcon from './RelationIcon.vue';

const props = defineProps<{
	note: Ref<Note>,
}>();
const {note} = toRefs(props);

const contents = computed( () => {
	const c = note.value.contents;
	let ret :{text: string, search_highlight?: boolean}[] = [];	// note.value.contents;
	const s = notes_graph.search_term.value;
	let cur_i = 0;
	if(s) {
		const re = new RegExp(s, 'igd');
		for( const match of note.value.contents.matchAll(re) ) {
			//@ts-ignore TS does not have indices yet: https://github.com/microsoft/TypeScript/issues/44227
			const start = match.indices[0][0];
			//@ts-ignore TS does not have indices yet: https://github.com/microsoft/TypeScript/issues/44227
			const end = match.indices[0][1];
			if( start > cur_i ) {
				ret.push({text:c.substring(cur_i, start)});
			}
			ret.push({text:c.substring(start, end), search_highlight: true});
			cur_i = end;
		}
		if( cur_i < c.length ) ret.push({text:c.substring(cur_i, c.length)});
	} else {
		ret.push({text:c});
	}
	return ret;
});

const selected = computed( () => page_control.selected_note_id.value === note.value.id );

const relations = computed( () => {
	const note_id = note.value.id;
	const ret: Record<'above'|'below', Record<string,number>> = {'above':{}, 'below': {}};
	note.value.relations.forEach(r => {
		let dir:'above'|'below' = 'above';
		if( r.target === note_id ) dir = 'below';
		if( !ret[dir][r.label] ) ret[dir][r.label] = 0;
		ret[dir][r.label]++;
	});
	return ret;
});

// Here we could just iterate over note_editor.rel_edits and check if target is this note
// But that measn doing this for every displayed note. Yikes.
// Let's do this for now?
const edit_rels = computed( () => {
	return note_editor.rel_edit.filter( (d) => d.note_id === note.value.id && (d.action==='' || d.action==='add')  );
});

const show_rel_controls = computed( () => selected.value && note_editor.has_data.value );

const classes = computed( () => {
	if( selected.value ) {
		return ['bg-yellow-200', 'hover:bg-yellow-100']
	}
	else if( note.value.id === note_editor.edit_note_id.value ) {
		return ['bg-lime-200'];
	}
	else {
		return ['hover:bg-yellow-50'];
	}
});

</script>

<template>
	<div class="flex flex-col md:flex-row" :class="classes" @click="page_control.selectNote(note.id)">
		<div class="flex-shrink-0 text-gray-500 md:w-28">{{note.created.toLocaleTimeString()}}</div>
		<div class="md:border-l-2 md:pl-1 border-amber-700 flex-grow md:pb-1" >
			<p class="">
				<template v-for="c in contents">
					<span class="bg-pink-300" v-if="c.search_highlight">{{c.text}}</span>
					<span v-else>{{c.text}}</span>
				</template>
			</p>
		</div>
		
		<div class="flex flex-shrink-0 justify-end self-end md:w-40 md:self-start">
			<span>&nbsp;</span>

			<span v-for="d in edit_rels"
				class="bg-yellow-200 rounded px-1">
				<RelationIcon :label="d.label" class="h-5 w-5"></RelationIcon>
			</span>

			<span v-if="Object.keys(relations.above).length" class="flex border-b-2">
				<span v-for="num, label in relations.above" class="flex ">
					<RelationIcon :label="label" class="h-5 w-5"></RelationIcon>
				</span>
			</span>
			<span v-if="Object.keys(relations.below).length" class="flex border-t-2"> 
				<span v-for="num, label in relations.below" class="flex">
					<RelationIcon :label="label" class="h-5 w-5"></RelationIcon>
				</span>
			</span>

			<div class="absolute" v-if="show_rel_controls">
				<RelationsControls :note="note"></RelationsControls>
			</div>
		</div>
	</div>
</template>