import {computed, ref, shallowRef, reactive} from 'vue';
import type {Ref, ComputedRef} from 'vue';
import { defineStore } from 'pinia';

export type Thread = {
	id: number,
	parent: number|undefined,
	name: string,
	created: Date,
	children: Thread[]
}

export const useThreadsStore = defineStore('threads', () => {
	const threads :Ref<Map<number,Thread>> = shallowRef(new Map); 

	// Threads..
	async function getAllThreads() {
		const resp = await fetch('/api/threads/');
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		const temp_threads :Map<number,Thread> = new Map;
		data.forEach( raw => {
			const id = parseInt(raw.id);
			temp_threads.set(id, {
				id,
				name: raw.name+'',
				created: new Date(raw.created),
				parent: raw.parent_id,
				children: []
			});
		});

		temp_threads.forEach( t => {
			if(!t.parent) return;
			const p = temp_threads.get(t.parent);
			p?.children.push(t);
		});
		threads.value = temp_threads;
	}

	function getThread(id:number) :Thread|undefined {
		return threads.value.get( id );
	}
	function mustGetThread(id:number) :Thread {
		const t = getThread(id);
		if( !t ) throw new Error("could not find thread "+id);
		return t;
	}

	return {
		getAllThreads, 
		getThread, mustGetThread
	};

});