'use strict';


// generated from converer.py script
let structs = [["hcp", "-", "hexagonal", "P", {"X": [[0, 0, 0], [0.6666666666666666, 0.3333333333333333, 0.5]]}], ["bcc", "-", "cubic", "I", {"X": [[0, 0, 0]]}], ["ccp", "-", "cubic", "F", {"X": [[0, 0, 0]]}], ["diamond", "C", "cubic", "F", {"C": [[0, 0, 0], [0.25, 0.25, 0.25]]}], ["caesium chloride", "CsCl", "cubic", "P", {"Cl": [[0, 0, 0]], "Cs": [[0.5, 0.5, 0.5]]}], ["sodium chloride", "NaCl", "cubic", "F", {"Cl": [[0, 0, 0]], "Na": [[0, 0, 0.5]]}], ["zinc blende", "ZnS", "cubic", "F", {"S": [[0, 0, 0]], "Zn": [[0.25, 0.25, 0.25]]}], ["wurtzite", "ZnS", "hexagonal", "P", {"S": [[0, 0, 0], [0.6666666666666666, 0.3333333333333333, 0.5]], "Zn": [[0, 0, 0.625], [0.6666666666666666, 0.3333333333333333, 0.125]]}], ["nickel arsenide", "NiAs", "hexagonal", "P", {"As": [[0, 0, 0], [0.6666666666666666, 0.3333333333333333, 0.5]], "Ni": [[0.3333333333333333, 0.6666666666666666, 0.25], [0.3333333333333333, 0.6666666666666666, 0.75]]}], ["fluorite", "CaF2", "cubic", "F", {"Ca": [[0, 0, 0]], "F": [[0.25, 0.25, 0.25], [-0.25, -0.25, -0.25]]}], ["rutile", "TiO2", "tetragonal", "P", {"Ti": [[0, 0, 0], [0.5, 0.5, 0.5]], "O": [[0.3, 0.3, 0], [-0.3, -0.3, 0], [0.8, 0.2, 0.5], [-0.8, -0.2, -0.5]]}], ["perovskite", "CaTiO3", "cubic", "P", {"Ti": [[0, 0, 0]], "Ca": [[0.5, 0.5, 0.5]], "O": [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5]]}]];

const HEX_C_A_SCALE = 1.5;
const TET_C_A_SCALE = 1.2;

var opts = {
    cell_dim: 1,
    atomic_radius: 0.2 // default `a` lattice parameter = 1
};

const lattice_vecs = {
    cubic: [[1,0,0],[0,1,0],[0,0,1]],
    hexagonal: [[-0.5,1*3**0.5/2,0],[1,0,0],[0,0,HEX_C_A_SCALE]],
    tetragonal: [[1,0,0],[0,1,0],[0,0,TET_C_A_SCALE]]
};

const lattice_type_frac_cds = {
    P: [[0,0,0]],
    I: [[0,0,0],[0.5,0.5,0.5]],
    F: [[0,0,0],[0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5]],
}

const predefined_colors = [
    [1,0.4,0.4],
    [0.4,1,0.4],
    [0,1,1],
    [1,0.4,1]
];

//let motifs = {
//    'cubic': {
//        'P': [0,1,2,3,4,5,6,7,8].map(x=>[x&1,(x>>1)&1,(x>>2)&1]),
//        'I': [0,1,2,3,4,5,6,7,8].map(x=>[x&1,(x>>1)&1,(x>>2)&1]).concat([0.5,0.5,0.5]),
//        'F': [0,1,2,3,4,5,6,7,8].map(x=>[x&1,(x>>1)&1,(x>>2)&1]).concat(
//            [[0.5,0,0],[0,0.5,0],[0,0,0.5],[-0.5,0,0],[0,-0.5,0],[0,0,-0.5]]),
//    },
//    'hexaganol': {
//        'P': [0,1,2,3,4,5,6,7,8].map(x=>[x&1+((x>>2)&1)/3**0.5,((x>>1)&1)*HEX_C_A_SCALE,(x>>2)&1])
//    },
//    'tetragonal': {
//        'P': [0,1,2,3,4,5,6,7,8].map(x=>[x&1,(x>>1)&1*TET_C_A_SCALE,(x>>2)&1]),
//    }
//}

let menu = document.getElementById('menu');

var current_structure;

for (let struct of structs){
    let d = document.createElement('div');
    let a = document.createElement('a');
    a.innerText = struct[0];
    a.href = '#';
    a.addEventListener('click', function(){
        current_structure = a;
        console.log('Loading', a.innerText);
        let add_vec = (a,b)=>a.map((x,i)=>x+b[i]);
        let transpose = m => m.map((r,i)=>r.map((x,j)=>m[j][i]));
        let spheres = [];
        let lattice_system = struct[2];
        let lattice_type = struct[3];
        let el_count = 0;
        for (let [element, motif_frac_cds] of Object.entries(struct[4])) {
            el_count++;
            // iterate over lattice points for this lattice type
            for (let lattice_cd of lattice_type_frac_cds[lattice_type]) {
                // iterate over the corners of the cube
                // i,j,k should start from 0, but for NaCl, the motif is
                // (0,0,1), so need to render from lattice points below in
                // surrounding octant
                for (let i=-1;i<opts.cell_dim+1;i++)
                for (let j=-1;j<opts.cell_dim+1;j++)
                for (let k=-1;k<opts.cell_dim+1;k++) {
                    //let corner = [i&1, (i>>1)&1, (i>>2)&1]; //000,001,010,001,etc.
                    let corner = [i, j, k];
                    let lattice_cd_ = add_vec(lattice_cd, corner);
                    // iterate over motif
                    for (let motif_cd of motif_frac_cds) {
                        let frac_cd = add_vec(lattice_cd_, motif_cd);
                        if (frac_cd.some(c => c < 0 || c > opts.cell_dim))  // check in unit cell
                            continue;
                        console.log(frac_cd);
                        let [a,b,c] = lattice_vecs[lattice_system];
                        // transform to the lattice_vecs coordinate system using a 4x4 matric
                        let [x,y,z,_] = m4.apply(transpose([
                            [...lattice_vecs[lattice_system][0], 0],
                            [...lattice_vecs[lattice_system][1], 0],
                            [...lattice_vecs[lattice_system][2], 0],
                            [0,0,0,1]
                        ]), [...frac_cd, 1]);
                        spheres.push([x,z,-y,opts.atomic_radius,predefined_colors[el_count]]);
                    }
                }
            }
        }
        buffer_data(spheres);
    });
    d.appendChild(a);
    let dd = document.createElement('div'); //hover styling of this in index.html css
    for (let i = 1; i < 4; i++) {
        let c = document.createElement('span');
        c.innerText = struct[i];
        dd.appendChild(c);
    }
    d.appendChild(dd);
    menu.appendChild(d);
}


menu.appendChild(document.createElement('hr'));
let inputs = {
    cell_dim: [[1,'+dim'], [-1,'-dim']],
    atomic_radius: [[0.1,'+radii'], [-0.1,'-radii']]
};
for (let [option, buttons] of Object.entries(inputs)){
    for (let [i,b] of Object.entries(buttons)) {
        let s = document.createElement('span');
        let a = document.createElement('a');
        a.href = '#';
        a.innerText = b[1];
        a.addEventListener('click', function(){
            opts[option] += b[0];
            if (opts[option] < 0.1) opts[option] = 0.1;
            current_structure.click();
        });
        if (i != buttons.length-1) s.style.marginRight = '1em';
        s.appendChild(a);
        menu.appendChild(s);
    }
    menu.appendChild(document.createElement('br'));
}
