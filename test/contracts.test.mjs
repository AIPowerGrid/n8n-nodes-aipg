import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

import {
	AIPG_API_BASE,
	OPERATION_CONTRACTS,
	optionalInteger,
	withDefinedValues,
} from '../dist/nodes/AiPowerGrid/contracts.js';
import { gridApiRequest } from '../dist/nodes/AiPowerGrid/transport.js';
import { AiPowerGrid } from '../dist/nodes/AiPowerGrid/AiPowerGrid.node.js';
import { AipgApi } from '../dist/credentials/AipgApi.credentials.js';
import {
	getAudioModels,
	getImageModels,
	getTextModels,
	getVideoModels,
} from '../dist/nodes/AiPowerGrid/loadOptions.js';

test('publishes from the dedicated repository with root credential source', async () => {
	const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
	assert.equal(
		packageJson.repository.url,
		'git+https://github.com/AIPowerGrid/n8n-nodes-aipg.git',
	);
	assert.equal(packageJson.repository.directory, undefined);
	await access(new URL('../credentials/AipgApi.credentials.ts', import.meta.url));
	assert.ok(packageJson.n8n.credentials.includes('dist/credentials/AipgApi.credentials.js'));
});

test('creator review workflow uses n8n tool wrapper for the agent connection', async () => {
	const workflow = JSON.parse(
		await readFile(new URL('../examples/creator-portal-review.json', import.meta.url), 'utf8'),
	);
	const tool = workflow.nodes.find((node) => node.name === 'AI Power Grid tool');

	assert.equal(tool.type, '@aipowergrid/n8n-nodes-aipg.aiPowerGridTool');
	assert.match(tool.parameters.textPrompt, /\$fromAI\('textPrompt'/);
	assert.equal(
		workflow.connections['AI Power Grid tool'].ai_tool[0][0].node,
		'AIPG tool agent',
	);
});

test('uses the fixed HTTPS production API', () => {
	assert.equal(AIPG_API_BASE, 'https://api.aipowergrid.io/v1');
	assert.deepEqual(Object.keys(OPERATION_CONTRACTS).sort(), ['audio', 'image', 'text', 'video']);
});

test('uses modality-specific endpoints and bounded wait times', () => {
	assert.equal(OPERATION_CONTRACTS.text.path, '/chat/completions');
	assert.equal(OPERATION_CONTRACTS.image.path, '/images/generations');
	assert.equal(OPERATION_CONTRACTS.video.path, '/videos/generations');
	assert.equal(OPERATION_CONTRACTS.audio.path, '/audio/generations');
	assert.ok(OPERATION_CONTRACTS.audio.timeout > OPERATION_CONTRACTS.video.timeout);
});

test('audio inference controls match the governed Core bounds', () => {
	const node = new AiPowerGrid();
	const steps = node.description.properties.find((property) => property.name === 'inferenceSteps');
	assert.equal(steps.typeOptions.minValue, 1);
	assert.equal(steps.typeOptions.maxValue, 20);
});

test('drops only absent optional values', () => {
	assert.deepEqual(withDefinedValues({ zero: 0, disabled: false, empty: '', absent: undefined }), {
		zero: 0,
		disabled: false,
	});
});

test('validates optional integer controls', () => {
	assert.equal(optionalInteger('', 'seed'), undefined);
	assert.equal(optionalInteger('42', 'seed'), 42);
	assert.throws(() => optionalInteger('4.2', 'seed'), /must be an integer/);
});

test('authenticates every request through the encrypted n8n credential', async () => {
	let captured;
	const context = {
		helpers: {
			httpRequestWithAuthentication: async (credentialType, options) => {
				captured = { credentialType, options };
				return { object: 'list', data: [] };
			},
		},
	};

	await gridApiRequest.call(context, 'GET', '/models');
	assert.equal(captured.credentialType, 'aipgApi');
	assert.equal(captured.options.url, 'https://api.aipowergrid.io/v1/models');
	assert.equal(captured.options.method, 'GET');
	assert.equal(captured.options.disableFollowRedirect, true);
	assert.equal(captured.options.body, undefined);
});

test('credential test uses an authenticated read-only endpoint', () => {
	const credential = new AipgApi();
	assert.equal(credential.test.request.method, 'GET');
	assert.equal(credential.test.request.url, '/account/credits');
	assert.equal(credential.test.request.disableFollowRedirect, true);
	assert.notEqual(credential.test.request.url, '/models');
});

test('text picker reads the canonical model catalog', async () => {
	const context = {
		helpers: {
			httpRequestWithAuthentication: async () => ({
				object: 'list',
				data: [{ id: 'gpt-oss-120b' }, { id: 'auto' }, { name: 'invalid' }],
			}),
		},
	};

	assert.deepEqual(await getTextModels.call(context), [
		{ name: 'auto', value: 'auto' },
		{ name: 'gpt-oss-120b', value: 'gpt-oss-120b' },
	]);
});

test('media pickers include only models compatible with each operation', async () => {
	const context = {
		helpers: {
			httpRequestWithAuthentication: async () => [
				{ name: 'Image Text', type: 'image', capabilities: ['txt2img'] },
				{ name: 'Image Edit', type: 'image', capabilities: ['img2img'] },
				{ name: 'Video Text', type: 'video', capabilities: ['txt2video'] },
				{ name: 'Video Image', type: 'video', capabilities: ['img2video'] },
				{ name: 'Music', type: 'audio' },
			],
		},
	};

	assert.deepEqual(await getImageModels.call(context), [{ name: 'Image Text', value: 'Image Text' }]);
	assert.deepEqual(await getVideoModels.call(context), [{ name: 'Video Text', value: 'Video Text' }]);
	assert.deepEqual(await getAudioModels.call(context), [{ name: 'Music', value: 'Music' }]);
});
