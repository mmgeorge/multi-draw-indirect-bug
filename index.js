"use strict";
async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice({
        requiredFeatures: ["indirect-first-instance"]
    });
    if (!device) {
        throw new Error("Browser does not support WebGPU");
    }
    const canvas = document.querySelector("canvas");
    if (!canvas) {
        throw new Error("Unable to find canvas");
    }
    const context = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });
    const shaderModule = device.createShaderModule({
        label: "Main shader",
        code: `
struct VertexInput {
  @builtin(instance_index) instance : u32,

  @location(0) position: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) color: vec3<f32>,
};

@group(0) @binding(0) var<uniform> offset: vec4<f32>;

@vertex
fn vs_main(model: VertexInput) -> VertexOutput {
  var out: VertexOutput;

  out.color = vec3<f32>(1, 0, 0);
  out.clip_position = vec4<f32>(model.position, 0, 1) + vec4<f32>(offset[model.instance], 0, 0, 0);

  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(in.color, 1.0);
}`
    });
    const pipeline = device.createRenderPipeline({
        label: "Main render pipeline",
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
            buffers: [
                {
                    arrayStride: 2 * 4,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: "float32x2"
                        }
                    ]
                }
            ]
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [{ format }]
        }
    });
    const passDesc = {
        label: 'Main renderPass',
        colorAttachments: [
            {
                view: null,
                clearValue: [0, 0, 1, 1],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };
    const vertexBufferCPU = new Float32Array([0, .5, -.5, -.5, .5, -.5]);
    const vertexBuffer = device.createBuffer({
        label: "Main vertex buffer",
        size: vertexBufferCPU.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexBufferCPU);
    const uniformBufferCPU = new Float32Array([.25, .5, 0, 0,]);
    const uniformBuffer = device.createBuffer({
        label: "Main uniform buffer",
        size: uniformBufferCPU.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformBufferCPU);
    const bindGroup = device.createBindGroup({
        label: "Main bind group",
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            }
        ]
    });
    const indirectBufferCPU = new Uint32Array([
        3,
        1,
        0,
        0,
        3,
        1,
        0,
        1 // firstInstance
    ]);
    const indirectBuffer = device.createBuffer({
        label: "Main indirect buffer",
        size: indirectBufferCPU.byteLength,
        usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(indirectBuffer, 0, indirectBufferCPU);
    function render() {
        passDesc.colorAttachments[0].view = context.getCurrentTexture().createView();
        const encoder = device.createCommandEncoder({ label: "Render pass encoder" });
        const pass = encoder.beginRenderPass(passDesc);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setBindGroup(0, bindGroup);
        pass.setPipeline(pipeline);
        // This does NOT work. It looks like the first drawIndirect takes priority
        pass.drawIndirect(indirectBuffer, 0); // <- Comment out line to shift triangle
        pass.drawIndirect(indirectBuffer, 4 * 4);
        // This works: 
        // pass.draw(3, 1, 0, 0);
        // pass.draw(3, 1, 0, 1);
        pass.end();
        const commands = encoder.finish();
        device.queue.submit([commands]);
    }
    render();
}
main();
